# 汉字练字帖生成器

从 1000 个常用汉字中选择，生成适合儿童练习的米字格练字帖，支持：
- 一行一个汉字的版式
- 每个字可设置连续打印 1 行或 2 行
- “字大小”决定每行米字格数量（大6格/中8格/小10格）

## 预览
- 首页选择汉字与排版选项，点击“打印练字帖”在新窗口生成打印版式。

## 本地运行
```
npm ci   # 或 npm i
npm start
# 访问 http://localhost:3000
```

## 主要脚本
- `npm start`：启动服务，默认端口 `3000`，可通过环境变量 `PORT` 覆盖。

## 目录结构
```
new-app/
  public/        # 前端静态资源(css/js)
  views/         # EJS 模板（首页）
  data/          # 常用汉字列表
  server.js      # Express 启动与路由
```

## 功能要点
- 事件委托减少 1000+ 个点击监听器开销。
- 本地保存所选汉字与字号设置，刷新后不丢失。
- 静态资源带缓存头；Express 隐藏 X-Powered-By。

## 部署
- 支持 Node.js 18+。
- 生产环境可使用任何支持 Node 的平台（Vercel/Render/自有服务器等）。

## 发布到 GitHub
1. 在 GitHub 新建一个空仓库（不要初始化 README）。
2. 在本地执行：
   ```bash
   git remote add origin <你的仓库URL>
   git branch -M main
   git push -u origin main
   ```

如需生成 PDF 可选配 `puppeteer` 并增加导出路由。
