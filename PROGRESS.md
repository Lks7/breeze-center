# breeze-center 项目进展报告

> 生成时间：2026-06-30
> 当前阶段：核心功能完成阶段

---

## 一、整体进度概览

| 模块 | 状态 | 完成度 |
|------|------|--------|
| 设计方案 | ✅ 已完成 | 100% |
| 前端脚手架 | ✅ 已完成 | 100% |
| 后端骨架（Go + chi） | ✅ 已完成 | 100% |
| 数据库（SQLite） | ✅ 已完成 | 100% |
| 配置系统（TOML） | ✅ 已完成 | 100% |
| 公开 API（只读） | ✅ 已完成 | 100% |
| Admin CRUD API | ✅ 已完成 | 100% |
| 管理后台界面 | ✅ 已完成 | 100% |
| 首页（真实数据） | ✅ 已完成 | 100% |
| 计划管理页 `/plans` | ✅ 已完成 | 100% |
| 服务中心页 `/services` | ✅ 已完成 | 100% |
| 博客阅读页 `/blog` | ✅ 已完成 | 100% |
| 书签墙页 `/bookmarks` | ✅ 已完成 | 100% |
| 古诗 API + TopBar 集成 | ✅ 已完成 | 100% |
| **RSS 真实抓取** | ✅ **已完成** | 100% |
| **RSS 阅读页面** | ✅ **已完成** | 100% |
| **文件管理中心** | ✅ **已完成** | 100% |
| **一键启动脚本** | ✅ **已完成** | 100% |
| **Ponytail 开发哲学** | ✅ **已完成** | 100% |
| GitHub 数据接入 | ⏳ 未开始 | 0% |
| 配置热更新 | ⏳ 未开始 | 0% |
| 服务健康检查（实时探测） | ⏳ 未开始 | 0% |
| 搜索功能 | ⏳ 未开始 | 0% |
| 设置面板 | ⏳ 未开始 | 0% |
| Widget 拖拽排序 | ⏳ 未开始 | 0% |
| PWA / 移动端适配 | ⏳ 未开始 | 0% |
| Docker 部署 | ⏳ 未开始 | 0% |

**总体完成度：约 75%（核心功能已完成，可正常使用）**

---

## 二、最新完成功能（2026-06-30）

### 2.1 RSS 真实抓取功能 ✨

**后端实现：**
- ✅ RSS/Atom 解析器（`server/internal/fetcher/rss.go`）
  - 使用 Go 标准库 `encoding/xml`
  - 支持 RSS 2.0 和 Atom 格式
  - 解析字段：标题、链接、描述、发布时间、作者
  
- ✅ 定时调度器（`server/internal/fetcher/scheduler.go`）
  - 30 分钟自动抓取间隔
  - 后台 goroutine + context 优雅停机
  - 遍历所有启用的订阅源
  
- ✅ 数据持久化
  - 批量插入 `rss_articles` 表
  - 去重逻辑：`UNIQUE(source_id, url)` + `INSERT OR IGNORE`
  - 更新 `rss_sources.last_fetched` 时间戳
  - 记录 `rss_sources.last_error` 失败信息

- ✅ 手动触发抓取 API
  - `POST /api/v1/admin/rss/fetch` 端点
  - 管理后台"🔄 立即抓取"按钮

**前端实现：**
- ✅ RSS 阅读页面（`/rss`）
  - 显示所有 RSS 文章列表（按时间倒序）
  - 订阅源标签筛选器（可按源筛选文章）
  - 显示文章来源、发布时间、摘要
  - 点击跳转原文（新标签页打开）
  - Neo-Glass 玻璃卡片设计
  
- ✅ 管理后台更新
  - 显示最后抓取时间
  - 显示抓取错误信息
  - "立即抓取"按钮，实时触发

- ✅ 首页集成
  - RssFeedWidget 显示最新 RSS 文章
  - 点击 Widget 跳转到 `/rss` 阅读页面

**测试结果：**
- ✅ 成功抓取 Astro Blog RSS（180 篇文章）
- ✅ 后端编译通过，无类型错误
- ✅ 前端 TypeScript 检查通过

### 2.2 文件管理中心 ✨

**集成方案：**
- ✅ 通过 iframe 嵌入 r2-web（https://r2-web.lks7.workers.dev/）
- ✅ 纯浏览器端的 Cloudflare R2 文件管理器
- ✅ 零后端、零构建、零维护

**功能特性：**
- 📤 文件上传/下载
- 🗂️ 目录浏览
- ✏️ 重命名、移动、删除
- 📦 批量操作
- 🖼️ 图片自动压缩
- 🖼️ 图片/视频/音频/文本预览
- 🔗 复制为 Markdown/HTML 链接
- 📱 PWA 支持
- ⌨️ 键盘导航
- 🌓 亮色/暗色主题

**前端实现：**
- ✅ 文件管理页面（`/files`）
  - 配置说明面板（可折叠）
  - 详细使用步骤
  - "新窗口打开"按钮
  - r2-web iframe 嵌入
  
- ✅ 管理后台菜单添加"文件中心"

### 2.3 一键启动脚本 ✨

**Windows 脚本：**
- ✅ `start.bat` - 一键启动前后端
  - 自动检查依赖（Go、pnpm）
  - 自动构建后端
  - 并发启动前后端服务
  - 使用 `npx vite` 绕过 pnpm 限制
  
- ✅ `stop.bat` - 一键停止所有服务
  - 查找并终止 server.exe 和 node.exe 进程

**Unix 脚本：**
- ✅ `start.sh` - Linux/Mac 启动脚本
- ✅ `stop.sh` - Linux/Mac 停止脚本

**编码修复：**
- ✅ 英文注释，避免 Windows GBK/UTF-8 编码问题

### 2.4 导航系统优化 ✨

**TopBar 更新：**
- ✅ Logo 点击回到首页（`/`）
- ✅ 齿轮图标进入管理后台（`/admin`）
- ✅ Hover 时放大效果
- ✅ Tooltip 提示

**管理后台更新：**
- ✅ Logo 点击回到首页
- ✅ 移除博客管理菜单项
- ✅ 默认进入 RSS 订阅页面
- ✅ 添加文件中心菜单项

**路由更新：**
- ✅ 添加 `/rss` 公开阅读页面
- ✅ 添加 `/files` 文件管理页面
- ✅ 移除 `/admin/blog` 路由

### 2.5 Ponytail 开发哲学 ✨

**核心文档：**
- ✅ `.trellis/tasks/06-30-ponytail/ponytail-principles.md`
  - 决策阶梯（7 层）
  - 永不妥协的底线（安全、错误处理、数据完整性、可访问性）
  - 完整示例（RSS 抓取、Web 框架选择、UI 组件库选择）
  
- ✅ `.trellis/tasks/06-30-ponytail/ponytail-review-checklist.md`
  - 代码审查检查清单
  - 贯穿整个开发流程

**集成到项目：**
- ✅ `.trellis/spec/backend/quality-guidelines.md`
  - Ponytail 原则整合到后端质量指南
  
- ✅ `.trellis/spec/frontend/quality-guidelines.md`
  - Ponytail 原则整合到前端质量指南

**实践成果：**
- ✅ RSS 抓取使用 Go 标准库（零依赖）
- ✅ 文件中心使用 iframe 嵌入（零维护）
- ✅ 移除内置博客功能（YAGNI）

---

## 三、已完成功能详细清单

### 3.1 设计与架构

- ✅ 设计方案文档
  - Neo-Glass Tech 设计语言（玻璃卡片 + 极光背景 + 渐变文字）
  - 色彩系统（暗色默认 + 亮色可选，CSS 变量驱动）
  - Widget 类型体系（rss-feed / stat-card / status-list / todo-list / link-grid）
  - 完整项目目录结构

### 3.2 前端基础设施

- ✅ Vite 6 + React 19 + TypeScript + Tailwind CSS 4
- ✅ 路径别名 `@/` → `src/`
- ✅ BrowserRouter 路由系统
- ✅ TanStack Query 数据获取（缓存 + 失效管理）
- ✅ 主题切换（暗色/亮色，localStorage 持久化）
- ✅ 设计系统 CSS（`styles/global.css`）
  - CSS 变量定义（暗色/亮色双套）
  - glass-card / gradient-text / status-pulse / aurora-blob / sparkle / count-rise 等工具类
  - 自定义滚动条样式

### 3.3 前端 UI 组件库

| 组件 | 文件 | 功能 |
|------|------|------|
| AuroraBackground | `components/ui/AuroraBackground.tsx` | 3 blob 慢速漂移极光背景 |
| GlassCard | `components/ui/GlassCard.tsx` | 半透明毛玻璃卡片，hover 微抬 |
| GradientText | `components/ui/GradientText.tsx` | 渐变文字 |
| StatusDot | `components/ui/StatusDot.tsx` | 状态指示器（ok/warn/error/idle + 脉冲动画） |
| Sparkle | `components/ui/Sparkle.tsx` | 随机闪烁粒子 |
| TopBar | `components/layout/TopBar.tsx` | 顶部栏：Logo + 搜索 + 时间 + 古诗 + 主题切换 + 导航 |
| Footer | `components/layout/Footer.tsx` | 页脚 |

### 3.4 前端 Widget 组件

| Widget | 文件 | 数据源 | 跳转目标 |
|--------|------|--------|----------|
| HeroCard | `widgets/HeroCard.tsx` | 父组件 derive | stats 各自跳转 |
| StatCardWidget | `widgets/StatCardWidget.tsx` | 父组件传入 | `/plans` `/rss` `/services` |
| RssFeedWidget | `widgets/RssFeedWidget.tsx` | RSS 文章 | `/rss` |
| ServiceStatusWidget | `widgets/ServiceStatusWidget.tsx` | serviceAPI | `/services` |
| TodoWidget | `widgets/TodoWidget.tsx` | todoAPI（可点击勾选） | `/plans` |
| BookmarkWidget | `widgets/BookmarkWidget.tsx` | bookmarkAPI | `/bookmarks` |
| WidgetCard | `widgets/WidgetCard.tsx` | 通用外壳，支持 `to` prop 跳转 | — |
| ServiceNav | `services/ServiceNav.tsx` | serviceAPI（按分类分组） | 服务 URL 外链 |

### 3.5 前端页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/` | `pages/HomePage.tsx` | 首页仪表盘（Hero + Widget + 服务导航） |
| `/plans` | `pages/PlansPage.tsx` | 计划管理（三列优先级看板 + 快速添加） |
| `/services` | `pages/ServicesPage.tsx` | 服务中心（按分类分组卡片网格 + 状态摘要） |
| `/blog` | `pages/BlogPage.tsx` | 博客阅读（列表 + 客户端搜索） |
| `/rss` | `pages/RSSPage.tsx` | **RSS 阅读页面（订阅源筛选）** ✨ |
| `/files` | `pages/FilesPage.tsx` | **文件管理中心（r2-web 嵌入）** ✨ |
| `/bookmarks` | `pages/BookmarksPage.tsx` | 书签墙（按分类分组） |
| `/admin` | `pages/admin/AdminLayout.tsx` | 管理后台布局（左侧导航 + Outlet） |
| `/admin/rss` | `pages/admin/RSSAdmin.tsx` | RSS 源 CRUD + 手动抓取 |
| `/admin/services` | `pages/admin/ServiceAdmin.tsx` | 服务实例 CRUD |
| `/admin/bookmarks` | `pages/admin/BookmarkAdmin.tsx` | 书签 CRUD |
| `/admin/todos` | `pages/admin/TodoAdmin.tsx` | 待办 CRUD（快速添加式） |

### 3.6 后端基础设施

- ✅ Go module `github.com/breeze/center`
- ✅ chi 路由 + rs/cors 中间件 + 优雅启停
- ✅ modernc.org/sqlite（纯 Go，无 cgo 依赖）
- ✅ SQLite schema 自动迁移（6 张表 + 索引）
- ✅ WAL 模式 + 外键约束 + 软删除

### 3.7 后端 API 端点

**公开 API（只读）：**

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/v1/services` | 服务列表（支持 `?category=` 过滤） |
| GET | `/api/v1/services/categories` | 分类分组 |
| GET | `/api/v1/services/{id}` | 单个服务详情 |
| GET | `/api/v1/widgets` | 所有 widget 配置 |
| GET | `/api/v1/widgets/data?type=xxx` | widget 数据 |
| GET | `/api/v1/poetry/random` | 随机古诗（代理外部 API） |

**Admin CRUD API：**

| 实体 | 方法 | 路径 |
|------|------|------|
| 博客 | GET/POST/PUT/DELETE | `/api/v1/admin/blog/posts` |
| RSS 源 | GET/POST/PUT/DELETE | `/api/v1/admin/rss/sources` |
| RSS 文章 | GET | `/api/v1/admin/rss/articles` |
| **RSS 抓取** | **POST** | `/api/v1/admin/rss/fetch` ✨ |
| 书签 | GET/POST/PUT/DELETE | `/api/v1/admin/bookmarks` |
| 待办 | GET/POST/PUT/DELETE/PATCH | `/api/v1/admin/todos` |
| 服务实例 | GET/POST/PUT/DELETE | `/api/v1/admin/services` |

### 3.8 RSS 抓取系统 ✨

**核心组件：**

| 文件 | 功能 |
|------|------|
| `server/internal/fetcher/types.go` | RSS/Atom 数据结构定义 |
| `server/internal/fetcher/rss.go` | RSS/Atom 解析器（标准库 `encoding/xml`） |
| `server/internal/fetcher/scheduler.go` | 定时调度器（30 分钟间隔） |
| `server/internal/handler/rss.go` | 手动触发抓取 API handler |
| `server/internal/store/rss.go` | RSS 数据库操作（批量插入 + 去重） |

**工作流程：**
```
定时调度器 (30分钟)
    ↓
遍历 enabled RSS 源
    ↓
HTTP GET RSS URL
    ↓
解析 XML (encoding/xml)
    ↓
写入 rss_articles (去重)
    ↓
更新 rss_sources.last_fetched
```

### 3.9 配置系统

- ✅ `config/site.toml` — 全局站点配置（端口、CORS、语言）
- ✅ `config/services/*.toml` — 6 个服务通用模板
- ✅ `config/providers/personal/*.toml` — 4 个个人实例（继承 base_service）
- ✅ 继承合并机制（模板字段为默认值，instance 覆写差异）

### 3.10 数据库 Schema

| 表 | 用途 |
|----|------|
| `blog_posts` | 博客文章（标题/正文/标签/状态/发布时间） |
| `rss_sources` | RSS 订阅源（URL/分类/启用状态/最后抓取时间） |
| `rss_articles` | RSS 文章（来源关联/URL/标题/摘要/发布时间） |
| `bookmarks` | 书签（标题/URL/分类/排序） |
| `todos` | 待办（文本/完成状态/优先级/截止日期） |
| `services` | 服务实例（动态，与 TOML 模板并存） |

### 3.11 开发工具与流程

- ✅ Trellis 任务管理（`.trellis/`）
- ✅ Ponytail 开发哲学（决策阶梯 + 质量指南）
- ✅ 一键启动脚本（`start.bat` / `start.sh`）
- ✅ 一键停止脚本（`stop.bat` / `stop.sh`）
- ✅ Vite 代理 `/api` → `localhost:8080`
- ✅ TypeScript 严格模式，0 类型错误

---

## 四、未完成功能清单

### 4.1 第一梯队：数据源接入

#### 🔴 GitHub 数据接入

**现状**：`config/services/github.toml` 模板存在，但没有 handler 调用 GitHub API。

**待做**：
- 后端新增 `internal/proxy/github.go`，调用 GitHub REST API
- 获取最近 commits / 贡献统计 / 仓库列表
- 凭证从环境变量读取
- 首页补回 GitHub 贡献 StatCard

**预计工作量**：中等

#### 🟡 服务健康检查（实时探测）

**现状**：服务状态是数据库 `status` 字段，手动设置。

**待做**：
- 后端新增 `internal/healthcheck/` 包
- 定时 HTTP 探测
- 探测结果回写 `status` 字段 + 记录延迟
- 首页 ServiceStatusWidget 显示真实延迟

**预计工作量**：小

### 4.2 第二梯队：功能完善

#### 🟡 配置热更新

**待做**：
- 引入 `fsnotify` 监听 `config/` 目录变化
- 变更时重新加载配置
- 无需重启即可生效

**预计工作量**：小

#### 🟡 搜索功能

**待做**：
- 后端新增 `/api/v1/search?q=xxx` 端点
- TopBar 搜索框接入
- 跨实体搜索（博客/书签/服务/待办）

**预计工作量**：中等

#### 🟡 设置面板

**待做**：
- 滑出式 SettingsPanel 组件
- 可配置项：Widget 显示/隐藏、排序、主题、刷新间隔
- 配置持久化

**预计工作量**：中等

#### 🟡 Widget 拖拽排序

**待做**：
- 引入 `@dnd-kit/core` + `@dnd-kit/sortable`
- WidgetGrid 支持拖拽
- 布局持久化

**预计工作量**：中等

### 4.3 第三梯队：工程化与部署

#### 🟢 Docker 部署

**待做**：
- `Dockerfile.web` + `Dockerfile.server`
- `docker-compose.yml`（web + server + 数据卷）
- Nginx 反向代理配置

**预计工作量**：小

#### 🟢 PWA 支持

**待做**：
- `vite-plugin-pwa` 集成
- manifest.json
- 离线缓存策略

**预计工作量**：小

#### 🟢 移动端适配

**待做**：
- 触摸手势优化
- 移动端专属布局
- 安全区域适配

**预计工作量**：中等

---

## 五、项目结构总览

```
breeze-center/
├── config/                         # TOML 配置
│   ├── site.toml                   # 全局站点配置
│   ├── services/                   # 6 个服务通用模板
│   └── providers/personal/         # 4 个个人实例
├── data/
│   └── breeze.db                   # SQLite 数据库（运行时生成）
├── server/                         # Go 后端
│   ├── cmd/server/main.go          # 入口（集成 RSS 调度器）
│   ├── internal/
│   │   ├── config/                 # TOML 加载与继承合并
│   │   ├── fetcher/                # RSS 抓取器 ✨
│   │   ├── handler/                # HTTP handler
│   │   ├── middleware/             # CORS + 请求日志
│   │   ├── model/                  # API 响应模型
│   │   ├── service/                # 服务注册表
│   │   └── store/                  # SQLite store
│   ├── go.mod / go.sum
│   └── bin/server.exe              # 构建产物
├── web/                            # React 前端
│   ├── src/
│   │   ├── api/                    # client + admin + poetry
│   │   ├── components/
│   │   │   ├── layout/             # TopBar + Footer
│   │   │   ├── ui/                 # 基础 UI 组件
│   │   │   ├── widgets/            # Widget 组件
│   │   │   └── services/           # ServiceNav
│   │   ├── hooks/                  # useTheme
│   │   ├── pages/
│   │   │   ├── admin/              # 管理后台
│   │   │   ├── HomePage.tsx
│   │   │   ├── PlansPage.tsx
│   │   │   ├── ServicesPage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   ├── RSSPage.tsx         # RSS 阅读页面 ✨
│   │   │   ├── FilesPage.tsx       # 文件管理页面 ✨
│   │   │   └── BookmarksPage.tsx
│   │   ├── types/entities.ts       # 实体类型定义
│   │   ├── utils/time.ts           # 时间格式化
│   │   └── styles/global.css       # 设计系统
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .trellis/                       # Trellis 任务管理
│   ├── tasks/
│   │   ├── 06-30-ponytail/         # Ponytail 哲学文档 ✨
│   │   └── 06-30-rss/              # RSS 任务 PRD ✨
│   └── spec/
│       ├── backend/                # 后端质量指南（含 Ponytail）
│       └── frontend/               # 前端质量指南（含 Ponytail）
├── start.bat / start.sh            # 一键启动脚本 ✨
├── stop.bat / stop.sh              # 一键停止脚本 ✨
├── README.md                       # 项目说明
├── AGENTS.md                       # AI 助手指南
└── PROGRESS.md                     # 本文档
```

---

## 六、启动方式

### 方法 1：一键启动（推荐）✨

**Windows：**
```bash
start.bat
```

**Linux/Mac：**
```bash
./start.sh
```

### 方法 2：手动启动

**后端（端口 8080）：**
```bash
cd server
go build -o bin/server.exe ./cmd/server
./bin/server.exe --config ../config --data ../data
```

**前端（端口 4321）：**
```bash
cd web
pnpm install
pnpm dev
```

### 访问地址

- 首页：http://localhost:4321
- 管理后台：http://localhost:4321/admin
- RSS 阅读：http://localhost:4321/rss
- 文件中心：http://localhost:4321/files

---

## 七、技术栈

### 前端
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- TanStack Query
- React Router

### 后端
- Go 1.23
- chi 路由
- modernc.org/sqlite（纯 Go，无 cgo）
- 标准库（net/http、encoding/xml、time）

### 开发哲学
- **Ponytail 决策阶梯**：YAGNI → 代码库复用 → 标准库 → 平台特性 → 依赖 → 一行胜于十行 → 零行胜于一行
- **永不妥协**：安全性、错误处理、数据完整性、可访问性

---

## 八、下一步建议

**推荐执行顺序**（按价值/成本比）：

1. **服务健康检查** — 让服务状态从手动变自动
2. **Docker 部署** — 标准化部署，为上线做准备
3. **配置热更新** — 改配置不用重启
4. **搜索功能** — TopBar 搜索框从 UI 变功能
5. **GitHub 数据接入** — 补回 GitHub 贡献卡片

---

## 九、Git 提交历史

```bash
776be0f - chore: initial commit - breeze-center MVP with Ponytail philosophy
b59f1aa - feat: implement RSS real-time fetching
12cb4f9 - refactor: simplify homepage to show only RSS articles
4157fd4 - chore: add one-click startup scripts and README
```

---

_本文档由 Breeze 生成于 2026-06-30，随项目进展持续更新。_
