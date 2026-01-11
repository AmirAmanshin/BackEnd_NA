const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./bank.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to SQLite.');
        
        db.run(`
            CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            card_number TEXT NOT NULL,
            expiration_date TEXT NOT NULL,
            cvc INTEGER NOT NULL
        )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
});

module.exports = db;