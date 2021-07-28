const sanitize = require('mongo-sanitize');

async function search(db, query) {
    query = sanitize(query);
    let results = await db.collection('movie').find({
        $and: [
            {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { original_title: { $regex: query, $options: 'i' } },
                    { id: parseInt(query) },
                    { imdb_id:query}
                ]
            },
            { status: "Released" }
        ]
    }).toArray();
    return results;
}


module.exports = search;