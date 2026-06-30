# breeze-center 项目长期记忆

## 项目概述
个人中心聚合网站 — 混合型（仪表盘 Widget + 门户导航），覆盖博客、自建服务、计划管理等。

## 技术栈
- 前端：React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Zustand + TanStack Query + React Router
- 后端：Go + chi（已搭建）+ modernc.org/sqlite（纯 Go SQLite）
- 配置：TOML（services 通用模板）+ SQLite（动态内容：博客/RSS/书签/待办/服务实例）
- 部署：Docker + Nginx（规划中）

## 设计语言
Neo-Glass Tech：暗色为主，玻璃卡片 + 极光背景 + 渐变文字。
参考 performativeUI（视觉）与 models.dev（数据驱动架构）。

## 关键路径
- 前端目录：`web/`，别名 `@/` → `src/`
- 后端目录：`server/`，Go module `github.com/breeze/center`
- 配置：`config/`（site.toml + services/ + providers/）
- 数据：`data/breeze.db`（SQLite，启动 `--data ../data`）
- dev 端口：前端 4321，后端 8080，Vite 代理 `/api` → 8080
- 管理后台：`http://localhost:4321/admin`（博客/RSS/服务/书签/待办 CRUD）
- 设计方案文档：`C:\Users\26574\.workbuddy\plans\quantum-vortex-curie.md`

## 工作流
- 本项目使用 Trellis 任务管理（`.trellis/`）
- breeze 偏好 pnpm、直接动手、简洁回复
