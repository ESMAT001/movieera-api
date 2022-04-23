const { projectionFields } = require('../../utils')
const { multiMoviePlaceholderImage } = require('./placeholderImage')

async function fetchMoviesRouteData(db, page, limit = 20) {
    const skip = (page - 1) * limit
    const data = await db.collection('movie')
        .find({ status: "Released" }, { projection: projectionFields })
        .sort({ release_date: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
    const ids = data.map(movie => movie.id)
    //remove duplicates from data array
    const uniqueData = data.filter((movie, index) => {
        return ids.indexOf(movie.id) === index
    })

    const totalResult = await db.collection('movie')
        .find({ status: "Released" })
        .count()

    const totalPages = Math.ceil(totalResult / limit)

    return { page, totalResult, totalPages, results: await multiMoviePlaceholderImage(uniqueData) }
}

module.exports = fetchMoviesRouteData