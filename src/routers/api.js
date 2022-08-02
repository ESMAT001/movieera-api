const express = require('express');
const cors = require('cors');
const { connectToDb } = require('../db')
const Trending = require('./functions/trending')
const fetchMoviesRouteData = require('./functions/movies')
const fetchSingleMovieData = require('./functions/movie')
const fetchRecommendationsData = require('./functions/recommendations')

const emitter = require('./functions/endScriptEmitter')

const search = require('./functions/search')

//test

const scrapeDataInBackground = require('./scrapy/index')


const dbName = "media"

const router = express.Router();

var allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5500', 'https://movieera.vercel.app','https://www.movieera.net'];
const corsOptions = {
    origin: function (origin, callback) {
        // console.log(origin, allowedOrigins)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(msg, false);
        }
        return callback(null, true);
    }
}

router.use(express.json())
router.use(cors(corsOptions))
router.get('/trending', async function (req, res) {
    const db = await connectToDb(dbName)
    res.send(await Trending(db).fetchData())
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
    let { query, limit = 10, page = 1, mode = 'basic' } = req.query
    if (limit) limit = parseInt(limit)
    if (page) page = parseInt(page)
    if (!query || /[-%^*|~={}\[\];<>?\/]/g.test(query)) return res.status(400).send("Bad request!");
    //connect to db
    const db = await connectToDb(dbName)
    const data = await search(db, query, limit, page, mode)
    if (!data.length) return res.status(404).send(data)
    res.status(200).send(data)
})

//recommendations endpoint
router.get('/recommendations', async (req, res) => {
    let { id, limit = 4 } = req.query
    if (limit) limit = parseInt(limit)
    if (!id || /[-%^*|~={}\[\];<>?\/]/g.test(id)) return res.status(400).send("Bad request!");
    //connect to db
    const db = await connectToDb(dbName)
    res.send(await fetchRecommendationsData(db, id, limit))
})

//genre endpoint
router.get('/genre', async (req, res) => {
    let { name, limit = 10, page = 1 } = req.query
    if (!name || !/[a-zA-Z]/g.test(name)) return res.status(400).send("Bad request from name!");
    //change first characeter to uppercase
    name = name.split(" ").map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(" ")

    if (limit) limit = parseInt(limit)
    if (page) page = parseInt(page)
    if (limit < 1 || page < 1) return res.status(400).send("Bad request!");
    //connect to db
    const db = await connectToDb(dbName)

    const { projectionFields } = require("../utils")

    let data = await db.collection('movie')
        .find({
            $and: [{ genres: { $elemMatch: { name } } },
            { status: "Released" }]
        }, { projection: { ...projectionFields, images: false } })
        .sort({ release_date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()

    if (!data.length) return res.status(404).send(data)

    //get unique movies
    let Ids = []
    data = data.filter(movie => {
        if (Ids.includes(movie.id)) return false
        Ids.push(movie.id)
        return true
    })

    const totalResult = await db.collection('movie')
        .find({
            $and: [{ genres: { $elemMatch: { name } } },
            { status: "Released" }]
        })
        .count()

    const totalPages = Math.ceil(totalResult / limit)

    const { multiMoviePlaceholderImage } = require("./functions/placeholderImage")

    res.status(200).send({ page, totalResult, totalPages, results: await multiMoviePlaceholderImage(data) })
})

router.get('/insights', async (req, res) => {
    const { username = null, password = null } = req.query
    const db = await connectToDb(dbName)
    const { value } = await db.collection("view").findOneAndUpdate({ id: 'first' }, { $inc: { count: 1 }, $set: { date: new Date() } })
    if (username === "skywalker" && password === "12124") {
        res.send(value)
    } else {
        res.status(403).send("forbiden")
    }
})




// const { searchMovie } = require('./scrapy/test')
// router.get('/test', async (req, res) => {
//     const response = await searchMovie(`${3} ${2223} ${'Space Jam A New Legacy'} ${2021}`)
//     res.send(response)
// const db = await connectToDb(dbName)
// res.send(await scrapeDataInBackground(db, true))
// })



module.exports = router