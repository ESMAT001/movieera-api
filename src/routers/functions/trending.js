const metaData = require('../../utils')
const got = require('got');
const { projectionFields } = metaData


class Trending {

    retryLimit = 4
    timeOutLimit = 20 * 1000

    movieCount = 22;

    projectionFieldsForOnlyId = {
        _id: false,
        adult: false,
        backdrop_path: false,
        belongs_to_collection: false,
        budget: false,
        genres: false,
        homepage: false,
        imdb_id: false,
        original_language: false,
        original_title: false,
        overview: false,
        popularity: false,
        poster_path: false,
        production_companies: false,
        production_countries: false,
        release_date: false,
        revenue: false,
        runtime: false,
        spoken_languages: false,
        status: false,
        tagline: false,
        title: false,
        video: false,
        vote_average: false,
        vote_count: false,
        videos: false,
        images: false,
        download_links: false
    }

    constructor(db) {
        this.db = db
    }


    async fetchData() {
        const db = this.db
        const movieIds = await this.getIds()
        const trendingMovieData = await db.collection("movie").find({
            $and: [{ 'id': { $in: movieIds.trending } },
            { adult: false }]
        }, {
            projection: projectionFields
        })
            .sort({ release_date: -1 })
            .toArray()

        const genreMovieData = []
        for (let index = 0; index < movieIds.genres.length; index++) {
            const genre = movieIds.genres[index];
            let genreData = await db.collection("movie").find({
                $and: [{ 'id': { $in: genre.movieIds } },
                { adult: false }]
            }, {
                projection: projectionFields
            })
                .sort({ release_date: -1 })
                .toArray()
            const insertedIds = []
            const finalRes = []
            for (let index = 0; index < genreData.length; index++) {
                const movie = genreData[index];
                if (insertedIds.indexOf(movie.id) === -1) {
                    insertedIds.push(movie.id)
                    finalRes.push(movie)
                }
            }

            genreMovieData.push(
                {
                    [genre.name]: finalRes
                }
            )
        }

        const ids = trendingMovieData.map(movie => movie.id)
        const uniqueMovieData = trendingMovieData.filter((movie, index) => {
            return ids.indexOf(movie.id) === index
        })
        return { trending: uniqueMovieData, genres: genreMovieData }
    }


    async getIds() {
        const db = this.db

        const dbData = await db.collection("meta_data").findOne({ name: "trending" })
        let shouldUpdateData = false;
        if (dbData) {
            const lastUpdated = new Date(dbData.last_updated)

            lastUpdated.setDate(lastUpdated.getDate() + 1)

            if (lastUpdated < new Date()) shouldUpdateData = true;

        } else {
            let date = new Date()
            date.setDate(date.getDate() + 1)
            date = date.toUTCString()
            await db.collection("meta_data").insertOne({
                name: 'trending',
                last_updated: date
            })
            shouldUpdateData = true
        }

        if (shouldUpdateData) {
            console.log('updating db for new trending data')
            const movieIds = await this.apiCallForIds()

            let date = new Date()
            date.setDate(date.getDate() + 1)
            date = date.toUTCString()

            await db.collection("meta_data").updateOne({
                name: 'trending'
            }, {
                $set: { movieIds, last_updated: date }
            })


            //for tweet

            let { ids } = await db.collection("tweet_queue").findOne({})
            //remove id from movieIds which are already in tweet queue
            const newIds = movieIds.filter(id => ids.indexOf(id) === -1)

            if (newIds.length > 0) {
                const movies = await db.collection("movie").find({
                    $and: [{ 'id': { $in: newIds } },
                    { adult: false }]
                }).toArray()

                movies.forEach(movie => {
                    if (movie.tweeted) newIds.pop(newIds.indexOf(movie.id))
                })

                ids = ids.concat(newIds)
                await db.collection("tweet_queue").updateOne({}, {
                    $set: { ids }
                })
            }

            return this.finalIds(movieIds);

        } else {
            console.log('using cached data for trending data')
            const { movieIds, genres } = await db.collection("meta_data").findOne({ name: "trending" })
            return { trending: movieIds, genres }
        }



    }


    async apiCallForIds() {
        const db = this.db
        const movieCount = this.movieCount
        let page = 1
        const movieIds = []
        do {
            let data = await got(metaData.getTrendingURL(page)).json()
            const results = data.results
            for (let index = 0; index < results.length; index++) {
                const id = results[index].id
                let movieDbData = await db.collection('movie').findOne(
                    {
                        $and: [
                            { id },
                            {
                                $or: [
                                    { $and: [{ "download_links.original_lang": { $exists: true } }, { "download_links.original_lang": { $not: { $size: 0 } } }] },
                                    { $and: [{ "download_links.persian_sub": { $exists: true } }, { "download_links.persian_sub": { $not: { $size: 0 } } }] },
                                    { $and: [{ "download_links.dual_lang": { $exists: true } }, { "download_links.dual_lang": { $not: { $size: 0 } } }] },
                                    { $and: [{ "download_links.persian_lang": { $exists: true } }, { "download_links.persian_lang": { $not: { $size: 0 } } }] },
                                ]
                            }

                        ]
                    }
                )
                if (movieDbData) movieIds.push(id)

                if (movieIds.length >= movieCount) return movieIds;
            }
            page++
        } while (movieIds.length < movieCount);
    }



    async finalIds(movieIds) {

        const db = this.db

        const finalObject = {
            trending: movieIds
        }

        let { genres } = await db.collection("meta_data").findOne({ name: "trending" })

        for (let index = 0; index < genres.length; index++) {
            const genre = genres[index];

            const { res, movieIds: finalMovieIds } = await this.getUniqueIds(movieIds, genre.id)

            movieIds = finalMovieIds
            genre.movieIds = res
        }

        await db.collection("meta_data").updateOne({
            name: 'trending'
        }, {
            $set: { genres }
        })

        finalObject.genres = genres

        return finalObject
    }



    async getUniqueIds(movieIds, genreId) {

        let uniqueIds = []
        while (uniqueIds.length < 4) {
            const limit = 4 - uniqueIds.length
            let res = await this.db.collection('movie')
                .find({
                    $and: [
                        { genres: { $elemMatch: { id: genreId } } }
                        , { id: { $nin: movieIds } },
                        { status: "Released" }
                    ]
                }, { projection: this.projectionFieldsForOnlyId })
                .sort({ release_date: -1 })
                .limit(limit)
                .toArray()

            //unique res ids
            let ids = res.map(movie => movie.id)
            const unique = ids.filter((id, index) => {
                return ids.indexOf(id) === index
            })
            uniqueIds = uniqueIds.concat(unique)
            movieIds = movieIds.concat(unique)
        }

        return {
            res: uniqueIds,
            movieIds
        }

    }


}


module.exports = (db) => new Trending(db)