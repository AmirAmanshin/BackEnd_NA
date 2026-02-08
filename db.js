const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'bank_data_db';

let client;
let db;

async function connectDB() {
    try {
        if (!uri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        client = new MongoClient(uri);
        await client.connect();

        db = client.db(dbName);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Connection error:", err.message);
        process.exit(1);
    }
}

function getDb() {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
}

module.exports = { connectDB, getDb };
