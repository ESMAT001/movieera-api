const sanitize = require('mongo-sanitize');
const { multiMoviePlaceholderImage } = require('./placeholderImage');

const projection = {
    _id: false,
    adult: false,
    homepage: false,
    overview: false,
    popularity: false,
    production_companies: false,
    production_countries: false,
    revenue: false,
    spoken_languages: false,
    tagline: false,
    video: false,
    videos: false,
    download_links: false

}

async function search(db, query, limit, page, mode = "full") {
    const skip = (page - 1) * limit
    query = sanitize(query);
    let results = await db.collection('movie').find({
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { original_title: { $regex: query, $options: 'i' } },
            { id: parseInt(query) },
            { imdb_id: query }
        ]
    }, {
        projection
    })

    const finalResults = await results.skip(skip).limit(limit).sort({ release_date: -1 }).toArray()

    const ids = finalResults.map(movie => movie.id);
    const uniqueResults = await multiMoviePlaceholderImage(
        finalResults.filter((movie, index) => {
            return ids.indexOf(movie.id) === index;
        })
    );

    if (mode !== "full") return uniqueResults;

    const totalResults = await results.count()
    const totalPages = Math.ceil(totalResults / limit)
    return { page, totalResults, totalPages, results: uniqueResults }

}


module.exports = search;