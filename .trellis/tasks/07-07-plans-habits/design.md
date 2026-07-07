# 设计文档：目标管理中心

## 页面布局

PlansPage 改造后布局（垂直流）：

```
┌─────────────────────────────────────┐
│  ← 首页    目标管理中心              │
│  ┌───┬───┬───┐                      │
│  │摘要│摘要│摘要│ (总待办/已完成/...) │
│  └───┴───┴───┘                      │
│  ┌─────────────────────────────┐    │
│  │ 快速添加栏                    │    │
│  └─────────────────────────────┘    │
│  ┌──────┬──────┬──────┐            │
│  │ 高优  │ 中优  │ 低优  │ (待办看板)│
│  └──────┴──────┴──────┘            │
│                                      │
│  ─── 今日打卡 ───                    │
│  ┌─────────────────────────────┐    │
│  │ HabitCard × N (待打卡/已打卡) │    │
│  └─────────────────────────────┘    │
│                                      │
│  ─── 进度总览 ───                    │
│  ┌──────┬──────┬──────┬──────┐     │
│  │ 连胜  │ 最长  │ 本周  │ 本月  │     │
│  └──────┴──────┴──────┴──────┘     │
│  ┌─────────────────────────────┐    │
│  │ 环形完成率 + 习惯列表        │    │
│  └─────────────────────────────┘    │
│                                      │
│  ─── 打卡日历 ───                    │
│  ┌─────────────────────────────┐    │
│  │ 月份切换 + 热力图 + 习惯筛选 │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## 组件树

```
PlansPage
├── SummaryBar (已有，微调)
├── QuickAddForm (已有，增强习惯选项)
├── PriorityColumns (已有，复用)
├── TodayCheckInSection ★ 新增
│   └── HabitCard × N (从 CheckInPage 迁入)
├── ProgressOverview ★ 新增
│   ├── StatsCards (从 CheckInPage 迁入)
│   ├── CompletionRing ★ 新增（环形完成率）
│   └── HabitList (各习惯完成状态)
├── CalendarSection ★ 新增
│   └── CalendarHeatmap (从 CheckInPage 迁入，增强)
└── HabitDetailPanel ★ 新增（模态框/侧边栏）
    ├── 基本信息
    ├── 打卡记录列表
    ├── 趋势迷你图
    └── 编辑/删除操作
```

## 数据流

```
┌──────────────┐     GET /api/v1/habits
│  PlansPage   │───────→ Habits (含今日状态+连胜)
│              │     GET /api/v1/admin/todos
│              │───────→ Todos
│              │     GET /api/v1/habits/{id}/stats
│              │───────→ HabitStats
│              │     GET /api/v1/check-ins?todo_id=&month=
│              │───────→ CheckInDates[]
│              │     POST /api/v1/check-ins
│              │───────→ CreateCheckIn
│              │     DELETE /api/v1/check-ins/{id}
│              │───────→ DeleteCheckIn
└──────────────┘
```

## 新增/修改的 API

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| POST | `/api/v1/check-ins/batch` | 批量查询某月打卡状态（支持多 habit_id） | 新增 |
| GET  | `/api/v1/check-ins?todo_id=&month=` | 已有，保持不变 | 已有 |
| DELETE | `/api/v1/check-ins/delete-by-date` | 按 todo_id + date 取消打卡 | 新增 |

## 后端改动

1. `store/checkin.go` - 新增 `DeleteByDate`（已有）、`ListAllByMonth`（已有）、新增 `BatchCheckStatus`
2. `handler/checkin.go` - 新增 `DeleteCheckInByDate` handler、`BatchCheckStatus` handler
3. `handler/todo.go` - 无需改动，复用现有

## 前端改动

| 文件 | 改动 |
|------|------|
| `pages/PlansPage.tsx` | 大规模重构：嵌入打卡、日历、进度 |
| `pages/CheckInPage.tsx` | 精简为 `/check-in` 快捷入口，复用组件 |
| `components/checkin/HabitCard.tsx` | 增加取消打卡交互 |
| `components/checkin/CalendarHeatmap.tsx` | 增加点击日期补打卡/取消打卡 |
| `components/checkin/StatsCards.tsx` | 保持不变 |
| `components/widgets/TodoWidget.tsx` | 增加今日待打卡习惯展示 |
| `api/checkin.ts` | 新增 batch check API |

## 组件复用策略

- 不复制代码：`checkin/` 下的组件从 CheckInPage 移到 PlansPage，CheckInPage 通过 import 复用
- 公共状态提升到 PlansPage，通过 props 下传
