const express = require('express');
const path = require('path');
const fs = require('fs');
const open = require('open').default;
const logger = require('./middleware/logger');
const { ObjectId } = require('mongodb'); 
const { connectDB, getDb } = require('./db');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static('public'));

app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query || query.trim() === "") {
        return res.status(400).send(`
            <h1>400 Bad Request</h1>
            <a href="/index.html">Return Home</a>
        `);
    }
    res.send(`
        <nav><a href="/index.html">Home</a> | <a href="/search">Search</a> | <a href="/contact.html">Contact</a></nav>
        <hr>
        <h1>Search Results</h1>
        <p>You searched for: <strong>${query}</strong></p>
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



app.get('/api/info', (req, res) => {
    res.json({
        name: "Bank site",
        description: "Banking System with MongoDB Integration",
        author: "Nuraly and Amir. A"
    });
});

app.get('/api/data', async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.collection('data').find({}).toArray();
        const formattedData = rows.map(item => ({
            id: item._id,
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

app.post('/api/data', async (req, res) => {
    const { full_name, card_number, expiration_date, cvc } = req.body;
    if (!full_name || !card_number || !expiration_date || !cvc) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const db = getDb();
        const result = await db.collection('data').insertOne({ full_name, card_number, expiration_date, cvc });
        res.status(201).json({ message: "success", id: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/data/:id', async (req, res) => {
    try {
        const db = getDb();
        const result = await db.collection('data').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "Record not found" });
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: "Update failed (Check ID format)" });
    }
});

app.delete('/api/data/:id', async (req, res) => {
    try {
        const db = getDb();
        const result = await db.collection('data').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Record not found" });
        res.json({ message: "deleted" });
    } catch (err) {
        res.status(400).json({ error: "Delete failed" });
    }
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        open(`http://localhost:${port}`); 
    });
});