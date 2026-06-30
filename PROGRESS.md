# breeze-center 项目进展报告

> 生成时间：2026-06-30
> 当前阶段：MVP 阶段（首页 + 管理后台 + 核心功能页 已完成）

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
| RSS 真实抓取 | ⏳ 未开始 | 0% |
| GitHub 数据接入 | ⏳ 未开始 | 0% |
| 配置热更新 | ⏳ 未开始 | 0% |
| 服务健康检查（实时探测） | ⏳ 未开始 | 0% |
| 搜索功能 | ⏳ 未开始 | 0% |
| 设置面板 | ⏳ 未开始 | 0% |
| Widget 拖拽排序 | ⏳ 未开始 | 0% |
| PWA / 移动端适配 | ⏳ 未开始 | 0% |
| Docker 部署 | ⏳ 未开始 | 0% |

**总体完成度：约 65%（核心功能可用，外部数据源与部署待补）**

---

## 二、已完成功能详细清单

### 2.1 设计与架构

- ✅ 设计方案文档 `C:\Users\26574\.workbuddy\plans\quantum-vortex-curie.md`
  - Neo-Glass Tech 设计语言（玻璃卡片 + 极光背景 + 渐变文字）
  - 色彩系统（暗色默认 + 亮色可选，CSS 变量驱动）
  - 服务集成两层模型（services 通用模板 + providers 个人实例，继承机制）
  - Widget 类型体系（rss-feed / stat-card / status-list / todo-list / link-grid）
  - 完整项目目录结构

### 2.2 前端基础设施

- ✅ Vite 6 + React 19 + TypeScript + Tailwind CSS 4
- ✅ 路径别名 `@/` → `src/`
- ✅ BrowserRouter 路由系统
- ✅ TanStack Query 数据获取（缓存 + 失效管理）
- ✅ 主题切换（暗色/亮色，localStorage 持久化）
- ✅ 设计系统 CSS（`styles/global.css`）
  - CSS 变量定义（暗色/亮色双套）
  - glass-card / gradient-text / status-pulse / aurora-blob / sparkle / count-rise 等工具类
  - 自定义滚动条样式

### 2.3 前端 UI 组件库

| 组件 | 文件 | 功能 |
|------|------|------|
| AuroraBackground | `components/ui/AuroraBackground.tsx` | 3 blob 慢速漂移极光背景 |
| GlassCard | `components/ui/GlassCard.tsx` | 半透明毛玻璃卡片，hover 微抬 |
| GradientText | `components/ui/GradientText.tsx` | 渐变文字 |
| StatusDot | `components/ui/StatusDot.tsx` | 状态指示器（ok/warn/error/idle + 脉冲动画） |
| Sparkle | `components/ui/Sparkle.tsx` | 随机闪烁粒子 |
| TopBar | `components/layout/TopBar.tsx` | 顶部栏：Logo + 搜索 + 时间 + 古诗 + 主题切换 |
| Footer | `components/layout/Footer.tsx` | 页脚 |

### 2.4 前端 Widget 组件

| Widget | 文件 | 数据源 | 跳转目标 |
|--------|------|--------|----------|
| HeroCard | `widgets/HeroCard.tsx` | 父组件 derive | stats 各自跳转 |
| StatCardWidget | `widgets/StatCardWidget.tsx` | 父组件传入 | `/blog` `/bookmarks` `/admin/rss` |
| RssFeedWidget | `widgets/RssFeedWidget.tsx` | blogAPI（已发布文章） | `/blog` |
| ServiceStatusWidget | `widgets/ServiceStatusWidget.tsx` | serviceAPI | `/services` |
| TodoWidget | `widgets/TodoWidget.tsx` | todoAPI（可点击勾选） | `/plans` |
| BookmarkWidget | `widgets/BookmarkWidget.tsx` | bookmarkAPI | `/bookmarks` |
| WidgetCard | `widgets/WidgetCard.tsx` | 通用外壳，支持 `to` prop 跳转 | — |
| ServiceNav | `services/ServiceNav.tsx` | serviceAPI（按分类分组） | 服务 URL 外链 |

### 2.5 前端页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/` | `pages/HomePage.tsx` | 首页仪表盘（Hero + 6 widget + 服务导航） |
| `/plans` | `pages/PlansPage.tsx` | 计划管理（三列优先级看板 + 快速添加） |
| `/services` | `pages/ServicesPage.tsx` | 服务中心（按分类分组卡片网格 + 状态摘要） |
| `/blog` | `pages/BlogPage.tsx` | 博客阅读（列表 + 客户端搜索） |
| `/bookmarks` | `pages/BookmarksPage.tsx` | 书签墙（按分类分组） |
| `/admin` | `pages/admin/AdminLayout.tsx` | 管理后台布局（左侧导航 + Outlet） |
| `/admin/blog` | `pages/admin/BlogAdmin.tsx` | 博客 CRUD |
| `/admin/rss` | `pages/admin/RSSAdmin.tsx` | RSS 源 CRUD |
| `/admin/services` | `pages/admin/ServiceAdmin.tsx` | 服务实例 CRUD |
| `/admin/bookmarks` | `pages/admin/BookmarkAdmin.tsx` | 书签 CRUD |
| `/admin/todos` | `pages/admin/TodoAdmin.tsx` | 待办 CRUD（快速添加式） |

### 2.6 后端基础设施

- ✅ Go module `github.com/breeze/center`
- ✅ chi 路由 + rs/cors 中间件 + 优雅启停
- ✅ modernc.org/sqlite（纯 Go，无 cgo 依赖）
- ✅ SQLite schema 自动迁移（6 张表 + 索引）
- ✅ WAL 模式 + 外键约束 + 软删除

### 2.7 后端 API 端点

**公开 API（只读，首页消费）：**

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/v1/services` | 服务列表（支持 `?category=` 过滤） |
| GET | `/api/v1/services/categories` | 分类分组 |
| GET | `/api/v1/services/{id}` | 单个服务详情 |
| GET | `/api/v1/widgets` | 所有 widget 配置 |
| GET | `/api/v1/widgets/data?type=xxx` | widget 数据（mock） |
| GET | `/api/v1/poetry/random` | 随机古诗（代理外部 API） |

**Admin CRUD API（动态内容，SQLite 持久化）：**

| 实体 | 方法 | 路径 |
|------|------|------|
| 博客 | GET/POST/PUT/DELETE | `/api/v1/admin/blog/posts` |
| RSS 源 | GET/POST/PUT/DELETE | `/api/v1/admin/rss/sources` |
| RSS 文章 | GET/PATCH | `/api/v1/admin/rss/articles` |
| 书签 | GET/POST/PUT/DELETE | `/api/v1/admin/bookmarks` |
| 待办 | GET/POST/PUT/DELETE/PATCH | `/api/v1/admin/todos` |
| 服务实例 | GET/POST/PUT/DELETE | `/api/v1/admin/services` |

### 2.8 配置系统

- ✅ `config/site.toml` — 全局站点配置（端口、CORS、语言）
- ✅ `config/services/*.toml` — 6 个服务通用模板
- ✅ `config/providers/personal/*.toml` — 4 个个人实例（继承 base_service）
- ✅ 继承合并机制（模板字段为默认值，instance 覆写差异）

### 2.9 数据库 Schema

| 表 | 用途 |
|----|------|
| `blog_posts` | 博客文章（标题/正文/标签/状态/发布时间） |
| `rss_sources` | RSS 订阅源（URL/分类/启用状态） |
| `rss_articles` | RSS 文章（来源关联/已读状态） |
| `bookmarks` | 书签（标题/URL/分类/排序） |
| `todos` | 待办（文本/完成状态/优先级/截止日期） |
| `services` | 服务实例（动态，与 TOML 模板并存） |

### 2.10 开发工具与流程

- ✅ Trellis 任务管理（`.trellis/`）
- ✅ ponytail-lazy-coder skill（懒惰阶梯编码哲学，用户级）
- ✅ Vite 代理 `/api` → `localhost:8080`
- ✅ TypeScript 严格模式，0 类型错误

---

## 三、未完成功能清单

按优先级排序，分三个梯队。

### 3.1 第一梯队：数据源接入（让数据真正活起来）

#### 🔴 RSS 真实抓取

**现状**：`rss_sources` 表可以存订阅源 URL，但没有抓取逻辑，`rss_articles` 表是空的。

**待做**：
- 后端新增 `internal/fetcher/rss.go`，定时（或按需）拉取 RSS 源 XML
- 解析后写入 `rss_articles` 表（去重：`UNIQUE(source_id, url)`）
- 更新 `rss_sources.last_fetched` 时间戳
- 首页 RssFeedWidget 改为混合显示（博客文章 + RSS 文章）
- `/admin/rss` 增加手动触发抓取按钮

**预计工作量**：中等（Go 标准库 `encoding/xml` 能解析 RSS，主要是调度与去重逻辑）

#### 🔴 GitHub 数据接入

**现状**：`config/services/github.toml` 模板存在，`providers/personal/github.toml` 引用了 `GITHUB_TOKEN` 环境变量，但没有任何 handler 调用 GitHub API。

**待做**：
- 后端新增 `internal/proxy/github.go`，调用 GitHub REST API
- 获取最近 commits / 贡献统计 / 仓库列表
- 凭证从环境变量读取（`credentials_ref` 字段已有引用）
- 首页补回 GitHub 贡献 StatCard（之前因无数据源删掉了）

**预计工作量**：中等（GitHub API 文档完善，主要是 token 管理与缓存）

#### 🟡 服务健康检查（实时探测）

**现状**：服务状态是数据库 `status` 字段，手动设置，不是实时探测。

**待做**：
- 后端新增 `internal/healthcheck/` 包
- 对 `services` 表中 `status=active` 的服务，定时 HTTP 探测
- 探测结果回写 `status` 字段 + 记录延迟
- 首页 ServiceStatusWidget 显示真实延迟

**预计工作量**：小（标准库 `net/http` + goroutine 定时器）

### 3.2 第二梯队：功能完善

#### 🟡 配置热更新

**现状**：修改 TOML 后需要重启后端。

**待做**：
- 引入 `fsnotify` 监听 `config/` 目录变化
- 变更时重新 `loader.Load()` + `registry.Reload()`
- 无需重启即可生效

**预计工作量**：小

#### 🟡 搜索功能

**现状**：TopBar 搜索框是纯 UI，没有实际功能。`/blog` 有客户端搜索。

**待做**：
- 后端新增 `/api/v1/search?q=xxx` 端点，跨实体搜索（博客/书签/服务/待办）
- TopBar 搜索框接入，下拉显示搜索结果
- 或跳转独立搜索页 `/search`

**预计工作量**：中等

#### 🟡 设置面板

**现状**：TopBar 设置按钮是纯 UI。

**待做**：
- 滑出式 SettingsPanel 组件
- 可配置项：Widget 显示/隐藏、排序、主题、刷新间隔
- 配置持久化到 localStorage 或后端

**预计工作量**：中等

#### 🟡 Widget 拖拽排序

**现状**：Widget 顺序固定，用户无法自定义。

**待做**：
- 引入 `@dnd-kit/core` + `@dnd-kit/sortable`
- WidgetGrid 支持拖拽，布局持久化到 localStorage
- 响应式断点适配

**预计工作量**：中等

### 3.3 第三梯队：工程化与部署

#### 🟢 Docker 部署

**现状**：无 Dockerfile，手动启动。

**待做**：
- `Dockerfile.web`（多阶段构建：node build → nginx serve）
- `Dockerfile.server`（多阶段构建：go build → alpine run）
- `docker-compose.yml`（web + server + 数据卷）
- Nginx 反向代理配置

**预计工作量**：小（标准模板）

#### 🟢 PWA 支持

**现状**：无 service worker，无 manifest。

**待做**：
- `vite-plugin-pwa` 集成
- manifest.json（图标/名称/主题色）
- 离线缓存策略
- 桌面快捷方式安装

**预计工作量**：小

#### 🟢 移动端适配

**现状**：响应式布局已有（grid 断点），但未针对触摸交互优化。

**待做**：
- 触摸手势（待办滑动完成/删除）
- 移动端专属布局（底部 tab bar 替代侧边栏）
- 安全区域适配（iOS notch）

**预计工作量**：中等

#### 🟢 通知系统

**现状**：无。

**待做**：
- 服务异常告警（WebSocket 推送或轮询）
- 待办截止日期提醒
- 浏览器 Notification API 集成

**预计工作量**：中等

#### 🟢 数据统计与分析

**现状**：无。

**待做**：
- Widget 使用频率统计
- 服务访问次数记录
- 智能排序（按使用频率自动调整 Widget 顺序）

**预计工作量**：中等

---

## 四、技术债务

| 项目 | 现状 | 建议处理时机 |
|------|------|-------------|
| Widget 数据端点 `/api/v1/widgets/data` 返回 mock | 后端 `handler/widgets.go` 的 `mockWidgetData` | RSS 抓取完成后替换 |
| `config/providers/personal/*.toml` 与 DB `services` 表数据重复 | 两套数据源并存 | 统一为 DB 驱动，TOML 仅留模板 |
| 无单元测试 | 0 测试覆盖 | 第一梯队功能完成后补 store 层测试 |
| 无错误边界（Error Boundary） | Widget 报错会白屏 | 加全局 ErrorBoundary 组件 |
| 无日志系统 | 后端用 `log.Printf` | 视需要引入 zerolog/zap |
| 无 CI/CD | 无自动化 | Docker 化后配 GitHub Actions |

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
│   ├── cmd/server/main.go          # 入口
│   ├── internal/
│   │   ├── config/                 # TOML 加载与继承合并
│   │   ├── handler/                # 11 个 HTTP handler 文件
│   │   ├── middleware/             # CORS + 请求日志
│   │   ├── model/                  # API 响应模型
│   │   ├── service/                # 服务注册表
│   │   └── store/                  # SQLite store（6 实体 + schema）
│   ├── go.mod / go.sum
│   └── bin/server.exe              # 构建产物
├── web/                            # React 前端
│   ├── src/
│   │   ├── api/                    # client + admin + poetry
│   │   ├── components/
│   │   │   ├── layout/             # TopBar + Footer
│   │   │   ├── ui/                 # 5 个基础 UI 组件
│   │   │   ├── widgets/            # 8 个 Widget 组件
│   │   │   └── services/           # ServiceNav
│   │   ├── hooks/                  # useTheme
│   │   ├── pages/
│   │   │   ├── admin/              # AdminLayout + AdminPage + 5 实体页
│   │   │   ├── HomePage.tsx
│   │   │   ├── PlansPage.tsx
│   │   │   ├── ServicesPage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   └── BookmarksPage.tsx
│   │   ├── types/entities.ts       # 实体类型定义
│   │   ├── utils/time.ts           # 时间格式化
│   │   └── styles/global.css       # 设计系统
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .trellis/                       # Trellis 任务管理
├── .workbuddy/memory/              # 项目记忆
├── AGENTS.md
└── PROGRESS.md                     # 本文档
```

---

## 六、启动方式

```bash
# 后端（端口 8080）
cd server
./bin/server.exe --config ../config --data ../data

# 前端（端口 4321，/api 代理到 8080）
cd web
pnpm dev

# 访问
# 首页：http://localhost:4321
# 管理后台：http://localhost:4321/admin
```

---

## 七、下一步建议

**推荐执行顺序**（按价值/成本比）：

1. **RSS 真实抓取** — 让首页文章动态真正活起来，数据源已有
2. **服务健康检查** — 让服务状态从手动变自动，体验提升大
3. **Docker 部署** — 标准化部署，为上线做准备
4. **配置热更新** — 改配置不用重启，开发体验提升
5. **搜索功能** — TopBar 搜索框从 UI 变功能
6. **GitHub 数据接入** — 补回 GitHub 贡献卡片

---

_本文档由 Breeze 生成于 2026-06-30，随项目进展持续更新。_
