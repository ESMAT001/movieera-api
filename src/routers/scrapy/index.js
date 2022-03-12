const scrapyJS = require('./scrapy')
const got = require("got")
const fs = require('fs')
const metaData = require('../../utils')

const baseURL = ''
const firstPage = 819
const lastPage = 1395


function movieDataScraper(db) {
    const spider = scrapyJS(baseURL, firstPage, lastPage, {
        nameSelector: 'div.content > div > p',
        downloadLinkSelector: "div.content > *",
        mainPageLinkSelector: 'div.title > h2 > a',
        notFoundSelector: "div.box > div.title",
        maxThreads: 8
    })

    spider.on('finished', () => {
        console.log('crawling finished')
    })

    spider.on("error", (error) => {
        console.log(error)

        if (error.url) fs.appendFileSync('./newError.txt', error.url + "\n");
    })

    spider.on('crawled', (data) => {
        console.log('from listener')
        console.log(data)
        // db.collection("movies").insertOne(data)
        //     .then(result => console.log('inserted!', result.ops))
        //     .catch(error => console.log('error on insertion :', error))
    })



    function checkIfTwoMediaIsSame(media1, media2) {
        let same = true

        if (media1 == null || media2 == null || media1 === undefined || media2 === undefined) {
            console.log("media1 or media2 is null")
            return false
        }

        for (const key in media2) {
            if (Object.hasOwnProperty.call(media2, key) && Object.hasOwnProperty.call(media1, key)) {
                //check if the two objects are array and their length and values are the same
                if (Array.isArray(media2[key]) && Array.isArray(media1[key])) {
                    if (media2[key].length !== media1[key].length) {
                        same = false
                    } else {
                        for (let i = 0; i < media2[key].length; i++) {
                            const subObj1 = media1[key][i];
                            const subObj2 = media2[key][i];
                            let elements1 = [];
                            let elements2 = [];
                            for (const subKey1 in subObj1) {
                                if (subObj1.hasOwnProperty.call(subObj1, subKey1)) {
                                    elements1.push(subObj1[subKey1]);
                                }
                            }
                            for (const subKey2 in subObj2) {
                                if (subObj2.hasOwnProperty.call(subObj2, subKey2)) {
                                    elements2.push(subObj2[subKey2]);
                                }
                            }

                            if (elements1.length !== elements2.length) {
                                same = false
                                break;
                            } else {
                                for (let index = 0; index < elements2.length; index++) {
                                    if (elements1[index] !== elements2[index]) {
                                        same = false
                                        break;
                                    }
                                }
                            }

                        }
                    }
                } else {
                    //check if the media1 and medi2 objects are undefined or null and change same to false
                    if (media2[key] === undefined || media2[key] === null && media1[key] !== undefined || media1[key] !== null) {
                        same = false
                    } else if (media1[key] === undefined || media1[key] === null && media2[key] !== undefined || media2[key] !== null) {
                        same = false
                    }
                }
            } else {
                same = false
            }
        }
        return same;
    }

    async function insertDataToDb({ download_links }, id, update = false) {

        if (update) {
            console.log('updating')
            return await db.collection("movie").updateOne({ id }, {
                $set: {
                    download_links,
                    tweeted: false,
                    links_updated: true,
                    last_updated: new Date().toUTCString()
                }
            })
        }

        const responseData = await got(metaData.getMovieDetailsURL(id)).json()
        if (responseData.id !== id) return;
        responseData.download_links = download_links
        responseData.tweeted = false
        responseData.tweeted_at = null
        responseData.tweet_id = null
        responseData.links_updated = false
        responseData.inserted_at = new Date().toUTCString()

        //insert response data to db
        await db.collection("movie").insertOne(responseData)
        console.log('inserted')
        console.log(responseData)
    }

    async function search(searchText) {
        const response = await spider.search(searchText)
        if (!response.data) {
            response.data = null
            return response
        }
        const movieId = parseInt(response.id)
        const dataFromDb = await db.collection("movie").findOne({ id: movieId });
        if (dataFromDb) {

            const { download_links: downloadLinksFromDbData } = dataFromDb
            const { download_links: downloadLinksFromSpiderData } = response.data
            //insert dataFromDb to db if download_links are different
            if (!checkIfTwoMediaIsSame(downloadLinksFromDbData, downloadLinksFromSpiderData)) {
                console.log('download links are different')
                await insertDataToDb(response.data, movieId, true)
            }

        } else {
            console.log('not found in db')
            await insertDataToDb(response.data, movieId)
        }

        return response
    }

    return { search, insertDataToDb }
}

async function scrapeDataInBackground(db, callback, shouldReturn = false) {

    const dbData = await db.collection("meta_data").findOne({ name: "scrapy" })
    let shouldScrapeData = false;
    if (dbData) {
        console.log('updating old db data')
        const lastUpdated = new Date(dbData.last_updated)
        lastUpdated.setHours(lastUpdated.getHours()+3)
        if (lastUpdated < new Date()) {
            shouldScrapeData = true
            let date = new Date()
            date.setDate(date.getDate() + 1)
            date = date.toUTCString()
            await db.collection("meta_data").updateOne({
                name: 'scrapy',
            }, {
                $set: { last_updated: date }
            })

            console.log('scrapy data updated', date)
        };

    } else {
        console.log('creating new data in db')
        let date = new Date()
        date.setDate(date.getDate() + 1)
        date = date.toUTCString()
        await db.collection("meta_data").insertOne({
            name: 'scrapy',
            last_updated: date
        })
        shouldScrapeData = true
    }


    if (shouldScrapeData) {
        console.log('scrapping data started')
        const totalPgesToScrape = 20
        const { search } = movieDataScraper(db)
        let foundData = []
        for (let page = 1; page <= totalPgesToScrape; page++) {

            const { results } = await got(metaData.getTrendingURL(page)).json()

            for (let index = 0; index < results.length; index++) {
                const movieName = results[index].original_title
                const movieId = results[index].id
                const movieDate = new Date(results[index].release_date).getFullYear()
                const returnData = await search(`${3} ${movieId} ${movieName} ${movieDate}`)
                if (returnData.data && shouldReturn) {
                    foundData.push(returnData.data)
                }
            }


        }
        console.log('scrapping data finished')
        if (shouldReturn) {
            return callback(foundData);
        }
        callback()
    } else {
        console.log('waiting for perfect time to scrape using data from db')
    }



}




module.exports = scrapeDataInBackground
