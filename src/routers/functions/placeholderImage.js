const got = require('got');
const { placeholderImageGenratorUrl } = require('../../utils')

const singleMoviePlaceholderImage = async (imagePath, type = "base64") => {
    try {
        const { base64 } = await got(`${placeholderImageGenratorUrl}?src=https://image.tmdb.org/t/p/w300_and_h450_bestv2/${imagePath[0] === "/" ? imagePath.slice(1) : imagePath}&type=${type}`).json();
        return base64;
    } catch (error) {
        return null;
    }
}

const multiMoviePlaceholderImage = async (movieData, type = "base64") => {
    // console.log(movieData)
    try {
        return await Promise.all(movieData.map(async (movie) => ({
            ...movie,
            placeholder: await singleMoviePlaceholderImage(movie.poster_path)
        }))).then(data => data);

        // const res= []
        // for (const movie of movieData) {
        //     res.push({
        //         ...movie,
        //         placeholder: await singleMoviePlaceholderImage(movie.poster_path)
        //     })
        // }
        // return res;

    } catch (error) {
        return movieData;
    }
}


module.exports = {
    singleMoviePlaceholderImage,
    multiMoviePlaceholderImage
}
