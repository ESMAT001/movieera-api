const scrapyJS = require('./scrapy')

const baseURL = ''
const firstPage = 819
const lastPage = 1395


function scrapyInit() {
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
    return { search: spider.search }
}

module.exports = scrapyInit()