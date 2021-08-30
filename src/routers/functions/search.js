const sanitize = require('mongo-sanitize');

const projection = {
    _id: false,
    adult: false,
    homepage: false,
    overview: false,
    popularity: false,
    production_companies: false,
    production_countries: false,
    revenue: false,
    spoken_languages: false,
    tagline: false,
    video: false,
    videos: false,
    download_links: false

}

async function search(db, query) {
    query = sanitize(query);
    let results = await db.collection('movie').find({
        $and: [
            {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { original_title: { $regex: query, $options: 'i' } },
                    { id: parseInt(query) },
                    { imdb_id: query }
                ]
            },
            { status: "Released" }
        ]
    }, {
        projection
    })
        .limit(10)
        .sort({ release_date: -1 })
        .toArray();
    return results;
}


module.exports = search;