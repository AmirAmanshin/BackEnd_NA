// ████ Import of packs ████
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open').default;
const logger = require('./middleware/logger');
const { ObjectId } = require('mongodb'); 
const { connectDB, getDb } = require('./db');


// ████ Port with env ████
const port = process.env.PORT || 3000


// ████ Express ████
const app = express();


// ████ Middle ████
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
// ╬╬╬ Logger ╬╬╬
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static('public'));


// ████ HTML getters ████
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// // Нуралы, тебе нужно сделать так, чтобы вылезала красивая страничка.
// app.get('/search', (req, res) => {
//     const query = req.query.q;
//     if (!query || query.trim() === "") {
//         return res.status(400).send(`
//             <h1>400 Bad Request</h1>
//             <a href="/index.html">Return Home</a>
//         `);
//     }
//     res.send(`
//         <link rel="stylesheet" href="/style.css">
//         <nav class="navbar navbar-expand-lg"><a href="/index.html">Home</a> | <a href="/search">Search</a> | <a href="/contact.html">Contact</a></nav>
//         <hr>
//         <h1>Search Results</h1>
//         <p>You searched for: <strong>${query}</strong></p>
//     `);
// });

app.get('/search', (req, res) => {
    const query = req.query.q;

    if (!query || query.trim() === "") {
        return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Bad Request</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>

        <nav class="navbar">
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="/contact.html">Contact</a>
        </nav>

        <h1>400 Bad Request</h1>
        <a href="/">Return Home</a>

        </body>
        </html>
                `);
            }

            res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Search</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>

        <nav class="navbar">
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="/contact.html">Contact</a>
        </nav>

        <hr>

        <h1>Search Results</h1>
        <p>You searched for: <strong>${query}</strong></p>

        </body>
        </html>
    `);
});

app.post('/contact.html', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).send('Fill all fields');
    }

    const contactData = { name, email, message, date: new Date() };
    const filePath = path.join(__dirname, 'contact_data.json');

    fs.writeFile(filePath, JSON.stringify(contactData, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server Error");
        }
        res.download(filePath, 'contact_data.json');
    });
});




// ████ CRUD API ████
app.get('/api/info', (req, res) => {
    res.json({
        name: "Bank site",
        description: "Banking System with MongoDB Integration",
        author: "Nuraly and Amir. A"
    });
});

// ╬╬╬ READ ╬╬╬
app.get('/api/data', async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.collection('data').find({}).toArray();
        const formattedData = rows.map(item => ({
            id: item._id.toString(),
            full_name: item.full_name,
            card_number: item.card_number,
            expiration_date: item.expiration_date,
            cvc: item.cvc
        }));
        res.json({ message: "success", data: formattedData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ╬╬╬ CREATE ╬╬╬
app.post('/api/data', async (req, res) => {
    const { full_name, card_number, expiration_date, cvc } = req.body;
    if (!full_name || !card_number || !expiration_date || !cvc) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const db = getDb();
        const result = await db.collection('data').insertOne({ full_name, card_number, expiration_date, cvc });
        res.status(201).json({
            message: "success",
            data: { id: result.insertedId.toString(), full_name, card_number, expiration_date, cvc }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ╬╬╬ UPDATE ╬╬╬
app.put('/api/data/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const update = { ...req.body };
    delete update._id;
    delete update.id;

    const result = await db.collection('data').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "success", modified: result.modifiedCount });
  } catch (err) {

    res.status(400).json({ error: "Update failed (check ID format)" });
  }
});

// ╬╬╬ DELETE ╬╬╬
app.delete('/api/data/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const result = await db.collection('data').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "deleted", id });
  } catch (err) {
    res.status(400).json({ error: "Delete failed (check ID format)" });
  }
});


// ████ Error calls ████
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});







connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});