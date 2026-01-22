const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('backend_na');
  }
  return db;
}

module.exports = connectDB;