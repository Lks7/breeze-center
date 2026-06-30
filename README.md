# breeze-center

> 个人中心仪表盘 —— Neo-Glass Tech 设计 + RSS 聚合器

## 快速开始

### 前置要求

- **Go** 1.21+ (后端)
- **Node.js** 18+ (前端)
- **pnpm** 8+ (包管理器)

### 一键启动

#### Windows

双击运行：

```bash
start.bat
```

或在命令行中：

```bash
.\start.bat
```

#### Linux / macOS

```bash
chmod +x start.sh
./start.sh
```

脚本会自动：
1. ✅ 检查后端是否编译，未编译则自动构建
2. ✅ 检查前端依赖是否安装，未安装则自动安装
3. ✅ 启动后端服务器（端口 8080）
4. ✅ 启动前端开发服务器（端口 4321）
5. ✅ 自动打开浏览器

### 停止服务

#### Windows

```bash
stop.bat
```

#### Linux / macOS

```bash
./stop.sh
```

或在启动脚本的终端按 `Ctrl+C`

## 访问地址

- **首页**: http://localhost:4321
- **管理后台**: http://localhost:4321/admin
- **后端 API**: http://localhost:8080/api

## 手动启动（开发）

如果你想分别启动前后端：

### 后端

```bash
cd server
go build -o bin/server.exe ./cmd/server  # Windows
# 或
go build -o bin/server ./cmd/server      # Linux/macOS

# 运行
./bin/server.exe --config ../config --data ../data  # Windows
# 或
./bin/server --config ../config --data ../data      # Linux/macOS
```

### 前端

```bash
cd web
pnpm install  # 首次运行
pnpm dev
```

## 功能特性

### ✅ 已实现

- 🎨 **Neo-Glass Tech 设计系统** - 玻璃卡片 + 极光背景
- 📰 **RSS 真实抓取** - 定时抓取外部 RSS 源（30 分钟间隔）
- 📊 **仪表盘** - 待办、服务状态、书签、RSS 文章
- 🔧 **管理后台** - RSS 源、待办、书签、服务管理
- 🎯 **服务导航** - 快速访问常用服务
- 🌓 **主题切换** - 暗色/亮色模式
- 📝 **待办管理** - 三优先级看板
- 🔖 **书签管理** - 分类收藏

### 🚧 规划中

- 🐙 GitHub 数据接入
- 💚 服务健康检查（实时探测）
- 🔍 全局搜索
- ⚙️ 设置面板
- 🐳 Docker 部署

## 项目结构

```
breeze-center/
├── config/              # TOML 配置文件
│   ├── site.toml       # 全局站点配置
│   ├── services/       # 服务模板
│   └── providers/      # 个人服务实例
├── data/               # SQLite 数据库（运行时生成）
├── server/             # Go 后端
│   ├── cmd/server/     # 入口
│   ├── internal/       # 内部包
│   │   ├── fetcher/    # RSS 抓取器
│   │   ├── handler/    # HTTP 处理器
│   │   ├── store/      # SQLite 数据层
│   │   └── ...
│   └── bin/            # 编译产物
└── web/                # React 前端
    ├── src/
    │   ├── components/ # UI 组件
    │   ├── pages/      # 页面
    │   ├── api/        # API 客户端
    │   └── ...
    └── dist/           # 构建产物
```

## RSS 使用

### 添加 RSS 源

1. 访问管理后台：http://localhost:4321/admin/rss
2. 点击"新建"
3. 填写信息：
   - **名称**: 订阅源名称（如 "Hacker News"）
   - **RSS URL**: RSS/Atom 订阅地址
   - **分类**: 可选分类（如 "tech"）
   - **图标颜色**: 十六进制颜色代码
   - **启用**: 是否启用自动抓取
4. 点击"保存"

### 手动触发抓取

在 RSS 管理页面点击 **"🔄 立即抓取"** 按钮，系统会立即抓取所有启用的 RSS 源。

### 自动抓取

系统每 **30 分钟** 自动抓取一次所有启用的 RSS 源。

### 推荐 RSS 源

- **Hacker News**: https://news.ycombinator.com/rss
- **GitHub Blog**: https://github.blog/feed/
- **阮一峰的网络日志**: https://www.ruanyifeng.com/blog/atom.xml
- **酷壳**: https://coolshell.cn/feed

## 技术栈

### 后端
- **Go** 1.21+
- **chi** - HTTP 路由
- **modernc.org/sqlite** - 纯 Go SQLite（无 cgo）
- **标准库** - RSS 解析、HTTP 客户端（零第三方依赖）

### 前端
- **React** 19
- **TypeScript** 5
- **Vite** 6
- **Tailwind CSS** 4
- **TanStack Query** - 数据获取与缓存

## 开发哲学

本项目遵循 **Ponytail 开发哲学**：

> **"懒惰的资深开发者"** —— 写代码前先走决策阶梯

### 决策阶梯

1. ❌ 需要存在吗？（YAGNI）
2. ❌ 代码库已有？
3. ✅ **标准库能做？** ← 优先使用
4. ✅ 原生特性？
5. ✅ 已装依赖？
6. 一行搞定？
7. 写最小代码

### 永不妥协

- ✅ 安全性（输入验证、SQL 参数化、XSS 防护）
- ✅ 错误处理（网络、解析、数据库错误）
- ✅ 数据完整性（事务、去重、验证）
- ✅ 可访问性（语义 HTML、ARIA、键盘导航）

## License

MIT

## 作者

breeze
