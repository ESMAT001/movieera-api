const express = require('express')
const mainRouter = require('./src/index')

const port = process.env.PORT || 3001



const server = express()
server.use("/api", mainRouter)
// server.get("*", (req, res) => handle(req, res))
server.listen(port, err => {
    if (err) throw err;
    console.log("server and app running on port " + port)
})
