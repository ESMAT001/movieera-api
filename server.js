const express = require('express')
const mainRouter = require('./src/index')

const port = process.env.PORT || 3001



const server = express()
server.use("/v1", mainRouter)
server.get("/", (req, res) => res.send("main page"))
server.get("*", (req, res) => res.status(404).send("resource not found!"))
server.listen(port, err => {
    if (err) throw err;
    console.log("server and app running on port " + port)
})
