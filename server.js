const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 读取 package.json 获取版本号
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const appVersion = packageJson.version;

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const commonChars = require('./data/common-chars.js');

// 主页路由
app.get('/', (req, res) => {
    // 将版本号传递给模板
    res.render('index', { commonChars: [], version: appVersion });
});

// API 路由：提供汉字数据
app.get('/api/chars', (req, res) => {
    res.json(commonChars);
});

// 打印路由：接收前端数据并渲染打印模板
app.post('/print', (req, res) => {
    const { selectedChars, gridSize, useAnimals } = req.body;

    if (!selectedChars || !Array.isArray(selectedChars) || selectedChars.length === 0) {
        return res.status(400).send('缺少需要打印的汉字');
    }

    // 渲染独立的打印模板
    res.render('print', {
        selectedChars,
        gridSize,
        useAnimals,
        currentDate: new Date().toLocaleDateString('zh-CN')
    });
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
