const { MongoClient } = require("mongodb")


// const uri = 'mongodb://127.0.0.1:27017'

const uri = "mongodb+srv://skyWalker:Vp5vX4VFapryv8au@cluster0.n4jif.mongodb.net/media?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let database;
async function connectToDb(dbName) {
    try {
        if (database) return database;
        console.log('creating new db')
        await client.connect();
        const db = client.db(dbName);
        await db.command({ ping: 1 });
        console.log("Connected successfully to db server");
        database = db
        return db
    } catch (err) {
        await client.close();
    }
}
//close db connection
async function closeDb() {
    if (database) {
        console.log("Closing db connection");
        await client.close();
        database = null;
    }
}

module.exports = {
    connectToDb, closeDb
}
