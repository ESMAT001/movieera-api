const got = require('got');

const metaData = require('../../utils')

async function fetchRecommendationsData(db, id, limit) {
    try {
        const { results } = await got(metaData.getRecommendationURL(id)).json();
        const ids = results.map(r => r.id);
        if (ids.length > limit) limit = ids.length;
        const res = await db.collection('movie').find({
            id: {
                $in: ids.slice(0, limit)
            }
        }, { projection: metaData.projectionFields })
            .sort({ release_date: -1 })
            .toArray();

        const addedRes = [];
        const uniqueRes = res.filter(r => !addedRes.includes(r.id) && addedRes.push(r.id));
        return uniqueRes;
    } catch (error) {
        return [];
    }

}

module.exports = fetchRecommendationsData;