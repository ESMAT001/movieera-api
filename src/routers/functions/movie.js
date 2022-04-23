const { singleMoviePlaceholderImage } = require("../functions/placeholderImage")
module.exports = async function fetchSingleMovieData(db, id) {
    const data = await db.collection('movie').findOne({ id }, {
        projection: {
            _id: false
        }
    })
    if (data) {
        data.placeholder = await singleMoviePlaceholderImage(data.poster_path)
    }
    return data
}