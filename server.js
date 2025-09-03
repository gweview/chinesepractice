const express = require('express');
const path = require('path');
// Removed unused puppeteer dependency

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Static assets with basic cache control
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const commonChars = require('./data/common-chars.js');

app.get('/', (req, res) => {
    res.render('index', { commonChars });
});

// Basic 404
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server Error');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`练字帖生成器运行在 http://localhost:${PORT}`);
    console.log(`局域网访问地址: http://[你的IP地址]:${PORT}`);
});
