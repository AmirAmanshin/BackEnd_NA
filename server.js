const express = require('express');
const open = require('open').default;
const path = require('path');
const fs = require('fs');

const app = express();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
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
        <nav>
            <a href="/index.html">Home</a> | <a href="/search">Search</a> | <a href="/contact.html">Contact</a>
        </nav>
        <hr>
        <h1>Search Results</h1>
        <p>You searched for: <strong>${query}</strong></p>
    `);
});

app.get('/item/:id', (req, res) => {
    const id = req.params.id;

    res.send(`
        <nav>
            <a href="/index.html">Home</a> | <a href="/search">Search</a> | <a href="/contact.html">Contact</a>
        </nav>
        <hr>
        <p>You are viewing the page for item ID: <strong>${id}</strong></p>
    `);
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
    // res.send('fhdsghbvf');
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/contact.html', (req, res) => {
    
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('Fill all fields');
    }

    const contactData = {
        name,
        email,
        message
    };

    const filePath = path.join(__dirname, 'contact_data.json');

    fs.writeFile(filePath, JSON.stringify(contactData, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server Error");
        }

    res.download(filePath, 'contact_data.json');})

});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    open('http://localhost:3000');
});

app.get('/api/info', (req, res) => {

    const projectInfo = {
        name: "Bank site",
        description: "Bank site.",
        author: "Nuraly and Amir. A"
    };

    res.json(projectInfo);
});

app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/views/404.html');
});