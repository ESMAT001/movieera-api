const express = require('express')
const mainRouter = require('./src/index')

const port = process.env.PORT || 3001

//for node production version bug 
if(typeof String.prototype.replaceAll == "undefined") {
    String.prototype.replaceAll = function(match, replace){
       return this.replace(new RegExp(match, 'g'), () => replace);
    }
}

const server = express()
server.use("/v1", mainRouter)
server.get("/", (req, res) => res.send("main page"))
server.get("*", (req, res) => res.status(404).send("resource not found!"))
server.listen(port, err => {
    if (err) throw err;
    console.log("server and app running on port " + port)
})
