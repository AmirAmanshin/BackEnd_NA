const express = require('express');
const open = require('open').default;

const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    open('http://localhost:3000');
});