const metaData = {
    apiKey: '3d97e93f74df6d3dd759d238a7b8564c',
    // placeholderImageGenratorUrl:"https://placeholder-image101.herokuapp.com",
    placeholderImageGenratorUrl:"https://placeholder-image010.herokuapp.com",
    getTrendingURL(page = 1) {
        return `https://api.themoviedb.org/3/trending/movie/week?api_key=${this.apiKey}&page=${page}`
    },
    getRecommendationURL(id, page = 1) {
        return `https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${this.apiKey}&language=en-US&page=${page}`
    }
    ,
    projectionFields: {
        _id: false,
        adult: false,
        belongs_to_collection: false,
        budget: false,
        homepage: false,
        imdb_id: false,
        production_companies: false,
        production_countries: false,
        revenue: false,
        spoken_languages: false,
        video: false,
        vote_count: false,
        videos: false,
        download_links: false
    },
    getMovieDetailsURL(id) {
        return `https://api.themoviedb.org/3/movie/${id}?api_key=${this.apiKey}&language=en-US&append_to_response=videos,images`
    }
}


module.exports = metaData