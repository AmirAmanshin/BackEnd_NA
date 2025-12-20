const express = require('express');
const open = require('open').default;
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
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
    const name = req.body;
    console.log(req.body);
    res.send(`<h2>Thanks, ${req.body.name}! Your message has been received.</h2>`);
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    open('http://localhost:3000');
});

app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/views/404.html');
});