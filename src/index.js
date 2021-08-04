const express = require('express');
const apiRouter = require('./routers/api')
const imageRouter = require('./routers/image')
const router = express.Router();

const whiteList = [undefined,'https://movieera-taupe.vercel.app/',]
const customMultipleCors = (whiteList) => {
    return (req, res, next) => {
        const origin = req.headers.origin;
        if (whiteList.indexOf(origin) === -1) {
           return res.status(403).send('Forbidden');
        }
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        console.log(req.headers.origin)
        next()
    }
}

router.use(customMultipleCors(whiteList))
router.use('/', apiRouter)
router.use('/image', imageRouter)

router.get("*", (req, res) => res.status(404).send("404!"))

module.exports = router
