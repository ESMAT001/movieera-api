const express = require('express');
const got = require('got');
const { connectToDb } = require('../db')
const fetchData = require('./functions/trending')
const fetchMoviesRouteData = require('./functions/movies')
const fetchSingleMovieData = require('./functions/movie')
const emitter = require('./functions/endScriptEmitter')

const search = require('./functions/search')

//test

const scrapeDataInBackground = require('./scrapy/index')

//test

// async function fn(){
//     for (let index = 0; index < 100; index++) {
//          got('https://camo.githubusercontent.com/736b987717afaaff5fb4a6380aee9f8e1467815d2044ed63dde61ca8e158bd89/68747470733a2f2f76697369746f722d62616467652e676c697463682e6d652f62616467653f706167655f69643d45534d4154303031')
//     }
// }
// fn()


const dbName = "media"

const router = express.Router();

router.use(express.json())

const whiteList = [
    'https://test.com/',
    'http://test.com/',
    "https://movieera.esmat@001.com",
    'https://movieera-taupe.vercel.app/',
    'https://rapidapi.com/'
]
const customMultipleCors = (whiteList) => {
    return (req, res, next) => {
        const origin = req.headers.origin;
        if (whiteList.indexOf(origin) === -1) {
            return res.status(403).send('Forbidden');
        }
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next()
    }
}

router.use(customMultipleCors(whiteList))



router.get('/trending', async function (req, res) {
    const db = await connectToDb(dbName)
    res.send(await fetchData(db))
    scrapeDataInBackground(db, () => emitter.emit('exit'))
})

router.get('/movies', async (req, res) => {
    let { page = 1 } = req.query
    if (!page || /[a-zA-Z./()$-]/g.test(page)) return res.status(400).send("Bad request!");
    page = parseInt(page)
    if (page < 1) return res.status(400).send("bad request")

    const db = await connectToDb(dbName)
    const data = await fetchMoviesRouteData(db, page)

    res.send(data)
})

router.get('/movie', async (req, res) => {

    let { id } = req.query
    if (!id || /[a-zA-Z./()$-]/g.test(id)) return res.status(400).send("Bad request!")
    id = parseInt(id)
    const db = await connectToDb(dbName)
    const data = await fetchSingleMovieData(db, id)
    if (!data) return res.status(404).send("Movie not found!")
    res.send(data)
})


//search endpoint 
router.get('/search', async (req, res) => {
    let { query } = req.query
    if (!query || /[-%^*|~={}\[\];<>?\/]/g.test(query)) return res.status(400).send("Bad request!");
    //connect to db
    const db = await connectToDb(dbName)
    const data = await search(db, query)
    if (!data.length) return res.status(404).send(data)
    res.status(200).send(data)
})




const { searchMovie } = require('./scrapy/test')
router.get('/test', async (req, res) => {
    const response = await searchMovie(`${3} ${2223} ${'Space Jam A New Legacy'} ${2021}`)
    res.send(response)
    // const db = await connectToDb(dbName)
    // res.send(await scrapeDataInBackground(db, true))
})



module.exports = router