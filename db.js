const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const dbName = 'bank_data_db';

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("Сonnected to MongoDB");
    } catch (err) {
        console.error("Сonnection error:", err);
        process.exit(1);
    }
}

function getDb() {
    if (!db) {
        throw new Error("Database not initialized.");
    }
    return db;
}

module.exports = { connectDB, getDb };