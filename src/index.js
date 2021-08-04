const express = require('express');
const apiRouter = require('./routers/api')
const imageRouter = require('./routers/image')
const router = express.Router();

router.use('/image', imageRouter)
router.use('/', apiRouter)
router.get("*", (req, res) => res.status(404).send("404!"))

module.exports = router
