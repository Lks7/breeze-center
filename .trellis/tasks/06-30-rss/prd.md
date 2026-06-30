# RSS 真实抓取功能

## Goal

实现 RSS 订阅源的真实抓取功能，让首页的文章动态内容真正活起来，从静态 mock 数据变为定时抓取的真实 RSS 文章。

## Background

**现状**：
- `rss_sources` 表可以通过管理后台添加 RSS 订阅源 URL
- `rss_articles` 表存在但是空的，没有抓取逻辑
- 首页 RssFeedWidget 目前只显示博客文章（`blog_posts` 表）
- Widget 数据端点 `/api/v1/widgets/data` 返回 mock 数据

**问题**：
- RSS 订阅源虽然可以配置，但没有真实抓取
- 用户无法看到外部 RSS 源的文章更新
- 缺少定时抓取机制

## Requirements

### 1. RSS 抓取核心功能

#### 1.1 RSS XML 解析
- 支持 RSS 2.0 和 Atom 格式
- 解析字段：标题、链接、描述、发布时间、作者
- 使用 Go 标准库（`encoding/xml`）

#### 1.2 数据持久化
- 抓取后写入 `rss_articles` 表
- 去重逻辑：`UNIQUE(source_id, url)` 约束
- 更新 `rss_sources.last_fetched` 时间戳
- 记录 `rss_sources.last_error` 失败信息

#### 1.3 错误处理
- HTTP 超时设置（10秒）
- 网络错误捕获并记录
- XML 解析错误处理
- 失败不影响其他源的抓取

### 2. 定时抓取机制

#### 2.1 后台调度器
- 启动时初始化 goroutine 调度器
- 可配置抓取间隔（默认 30 分钟）
- 优雅停机时等待当前抓取完成

#### 2.2 抓取策略
- 遍历 `rss_sources` 中 `enabled=true` 的源
- 按顺序抓取（避免并发过多）
- 记录每次抓取的成功/失败状态

### 3. 管理后台集成

#### 3.1 手动触发抓取
- `/admin/rss` 页面增加"立即抓取"按钮
- 后端增加 `POST /api/v1/admin/rss/fetch` 端点
- 可选：单个源或全部源

#### 3.2 抓取状态显示
- 显示最后抓取时间 `last_fetched`
- 显示抓取错误信息 `last_error`
- 显示源的文章数量

### 4. 首页 Widget 更新

#### 4.1 混合显示
- RssFeedWidget 显示：博客文章 + RSS 文章（混合）
- 按发布时间倒序排列
- 限制显示数量（如最新 10 条）

#### 4.2 数据源标识
- 文章显示来源标记（Blog / RSS 源名称）
- 点击跳转到原文链接

## Acceptance Criteria

- [ ] 创建 `internal/fetcher/rss.go` 包，实现 RSS 解析
- [ ] 实现定时抓取调度器（`internal/fetcher/scheduler.go`）
- [ ] 更新 `rss_sources` schema 增加 `last_fetched`, `last_error` 字段
- [ ] 实现手动触发抓取 API：`POST /api/v1/admin/rss/fetch`
- [ ] 更新 `/admin/rss` 页面，显示抓取状态 + 手动触发按钮
- [ ] 更新首页 RssFeedWidget，混合显示博客 + RSS 文章
- [ ] 测试：添加真实 RSS 源（如 Hacker News RSS），验证抓取成功
- [ ] 错误处理：网络失败、XML 解析失败不影响其他源

## Technical Design

### Ponytail 决策阶梯分析

走一遍决策阶梯：

1. **需要存在吗？** ✅ 是的，这是核心功能，RSS 抓取是项目需求
2. **代码库已有？** ❌ 没有，这是新功能
3. **标准库能做？** ✅ 是的！
   - `encoding/xml` 可以解析 RSS/Atom
   - `net/http` 可以抓取
   - `time.Ticker` 可以定时调度
4. **原生平台特性？** ✅ goroutine 用于后台调度
5. **已安装依赖？** ✅ 已有 `modernc.org/sqlite` 用于数据库操作

**结论**：不需要引入新依赖（如 gofeed），使用 Go 标准库即可。

### 架构设计

```
server/internal/fetcher/
├── rss.go          # RSS 解析器（标准库 xml）
├── scheduler.go    # 定时调度器
└── types.go        # RSS 数据结构

server/internal/handler/
└── rss.go          # 增加手动触发 API

server/cmd/server/main.go
└── 启动时初始化 fetcher.StartScheduler()
```

### 数据流

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

## Out of Scope

- ❌ 不支持需要认证的 RSS 源（当前只做公开 RSS）
- ❌ 不做全文抓取（只存 RSS 提供的摘要）
- ❌ 不做 RSS 源发现/推荐功能
- ❌ 不做复杂的抓取频率策略（统一间隔即可）

## Notes

- 遵循 Ponytail 原则：用标准库，不过度设计
- RSS 2.0 和 Atom 是两种常见格式，需要都支持
- 错误处理必须到位：网络、解析、数据库错误都要捕获
- 定时器要优雅停机，避免 goroutine 泄漏
