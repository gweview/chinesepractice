# 汉字练字帖生成器

从 1000 个常用汉字中选择，生成适合儿童练习的米字格练字帖，支持：
- 一行一个汉字的版式
- 每个字固定练习 1 行
- “字大小”决定每行米字格数量（大6格/中8格/小10格）
- 可选字库翻页（每页 100 个字），与搜索/筛选联动
- 打印页顶可选可爱动物装饰（勾选“打印页顶使用可爱动物装饰”）

## 预览
- 首页选择汉字与排版选项，点击“打印练字帖”在新窗口生成打印版式。

## 本地运行（Flask 版本，推荐）
```
# 进入项目根目录 chinesepractice/
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 开发运行（默认端口 3000，可用 PORT 覆盖）
python app.py
# 访问 http://localhost:3000
```

后端栈：Flask + Jinja2。静态资源仍位于 `public/`，通过 Flask 静态路由以 `/static/css/...`、`/static/js/...` 提供（模板已用 `url_for('static', ...)` 自动生成路径）。

如需继续使用旧的 Node/Express 版本（不推荐，仅兼容保留）：
```
npm i
npm run start:node
```

## 主要脚本
- `npm start`：启动服务，默认端口 `3000`，可通过环境变量 `PORT` 覆盖。

## 目录结构
```
chinesepractice/
  public/          # 前端静态资源(css/js)
  templates/       # Jinja2 模板（index/print）
  data/            # 常用汉字列表（JS 数组）
  app.py           # Flask 应用入口（开发）
  requirements.txt # Python 依赖
  server.js        # 旧版 Express 启动与路由（可选）
```

## 功能要点
- 事件委托减少 1000+ 个点击监听器开销。
- 刷新即重置选择与选项（不再持久化到本地存储）。
- 静态资源带缓存头；Express 隐藏 X-Powered-By。

## 部署
- Python 3.11+；建议用 Gunicorn 作为生产 WSGI 守护。
- 示例：`gunicorn -w 2 -b 0.0.0.0:3000 'app:app'`

## Docker 方式
```
cd chinesepractice
docker build -t chinesepractice:latest .
docker run --rm -it -p 3000:3000 chinesepractice:latest
# 访问 http://localhost:3000
```

## 使用 npm 启动（调用 Python）
在某些场景你可能希望仍通过 npm 统一启动命令：
```
cd chinesepractice
npm start           # 等价于 python3 app.py
npm run start:flask # 同上
npm run start:node  # 旧版 Node/Express 启动
```

## 发布到 GitHub
1. 在 GitHub 新建一个空仓库（不要初始化 README）。
2. 在本地执行：
   ```bash
   git remote add origin <你的仓库URL>
   git branch -M main
   git push -u origin main
   ```

如需生成 PDF 可选配 `puppeteer` 并增加导出路由。

## 更新记录

### 1.0.2
- 新增：可选字库翻页模式（每页 100 个字），与搜索/筛选联动。
- 新增：打印页顶可选可爱动物装饰（替代标题）。
- 优化：打印页样式与细节微调。

### 1.0.1
- 调整：重构前端交互与模板结构。
- 变更：取消“每字多行”设置，固定每字 1 行。
- 变更：刷新即重置，不再持久化本地选择与选项。
- 优化：样式与小功能改进。
