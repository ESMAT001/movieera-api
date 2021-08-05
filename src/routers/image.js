const express = require("express")
const got = require('got')


const router = express.Router()
const url = 'https://image.tmdb.org/t/p/w500/'
const placeholderImgUrl = 'https://image.tmdb.org/t/p/w300_and_h450_bestv2/'

router.get('/placeholder/:imgId', (req, res) => {
    const { imgId } = req.params
    res.redirect(placeholderImgUrl + imgId)
})

router.get('/:imgId', (req, res) => {
    const { imgId } = req.params
    res.redirect(url + imgId)
})

module.exports = router