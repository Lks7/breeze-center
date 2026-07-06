# 习惯打卡与目标管理

## Goal

创建习惯打卡功能，帮助用户追踪和坚持长期目标（如戒烟、跑步、阅读等），通过可视化和连胜机制提升目标完成率。

## Background

**现状**：
- 项目已有 Todo 待办事项系统
- Todo 适合一次性任务，不适合持续性习惯追踪
- 缺少习惯养成和坚持监督的功能

**用户需求**：
- 类似"戒烟打卡"、"跑步打卡"的功能
- 能看到自己是否坚持了制定的目标
- 查看每周、每月的完成度统计

**市场参考**：
- 像素习惯、小打卡、Forest等应用
- 核心特点：连胜系统、日历可视化、简单打卡

## Requirements

### 1. 数据模型扩展

#### 1.1 习惯目标（基于Todo扩展）

在现有 `todos` 表基础上扩展：
- 增加 `is_habit` 字段（区分普通待办和习惯目标）
- 增加 `habit_frequency` 字段：
  - `daily` - 每日打卡
  - `weekly` - 每周打卡
  - `monthly` - 每月打卡
- 增加 `habit_target` 字段（目标次数，如每周3次）

#### 1.2 打卡记录表（新建）

```sql
CREATE TABLE check_ins (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL,        -- 关联的习惯目标
  check_date TEXT NOT NULL,     -- 打卡日期 (YYYY-MM-DD)
  created_at TEXT NOT NULL,
  FOREIGN KEY (todo_id) REFERENCES todos(id)
);
```

### 2. 打卡界面 (`/check-in`)

#### 2.1 页面布局

**顶部：今日打卡区**
- 显示今天需要打卡的习惯列表
- 每个习惯显示：
  - 名称 + 图标
  - 今日是否已打卡
  - 连胜天数（🔥 N天）
  - 快速打卡按钮

**中部：日历热力图**
- 月度日历视图
- 已打卡的日期高亮显示
- 点击日期查看当天打卡详情
- 参考 GitHub Contribution Graph 样式

**底部：统计卡片**
- 本周完成率
- 本月完成率
- 总打卡次数
- 最长连胜记录

#### 2.2 习惯管理

**创建习惯：**
- 从 Todo 管理页面创建
- 勾选"设为习惯目标"选项
- 选择频率（每日/每周/每月）
- 设置目标次数（可选）

**编辑/删除：**
- 复用现有 Todo 的编辑功能
- 删除习惯时提示"将清空打卡记录"

### 3. 打卡操作

#### 3.1 快速打卡
- 点击习惯卡片上的"打卡"按钮
- 即时反馈：✅ 动画 + 连胜数字跳动
- 更新日历视图

#### 3.2 补卡功能（可选）
- 点击历史日期可补打卡
- 仅限近7天内
- 补卡不计入连胜

#### 3.3 取消打卡
- 点击已打卡的日期可取消
- 仅限当天

### 4. 数据统计

#### 4.1 连胜计算
- 从今天往前推，连续打卡的天数
- 中断1天即归零重新计算
- 显示：当前连胜 + 历史最长连胜

#### 4.2 完成率
- 本周完成率 = 本周已打卡次数 / 本周目标次数
- 本月完成率 = 本月已打卡次数 / 本月目标次数
- 支持按习惯单独统计

### 5. UI/UX 设计

#### 5.1 视觉风格
- 延续现有的 Glass Card 设计
- 打卡按钮醒目（主色调 accent-primary）
- 连胜数字使用火焰图标 🔥 + 橙红色
- 日历热力图使用渐变色（浅→深表示打卡频率）

#### 5.2 交互反馈
- 打卡成功：按钮动画 + Toast 提示
- 达成连胜里程碑（7天、30天、100天）：弹窗庆祝
- 连胜中断：温和提示"连胜已中断，继续加油"

## Acceptance Criteria

### MVP（第一阶段）
- [ ] 扩展 Todo 数据模型支持习惯目标
- [ ] 创建 check_ins 表存储打卡记录
- [ ] 创建 `/check-in` 页面
- [ ] 显示今日待打卡习惯列表
- [ ] 实现快速打卡功能
- [ ] 计算并显示连胜天数
- [ ] 日历热力图展示打卡历史
- [ ] 显示本周/本月完成率统计

### 增强功能（第二阶段，可选）
- [ ] 补卡功能（近7天）
- [ ] 习惯分类（健康、学习、工作等）
- [ ] 成就系统（徽章、里程碑）
- [ ] 数据导出（CSV）
- [ ] 打卡提醒通知

## Technical Design

### Ponytail 决策阶梯

1. **需要存在吗？** ✅ 是的，习惯追踪是明确的用户需求
2. **代码库已有？** ⚠️ 有 Todo 系统，但缺少打卡和统计功能
3. **标准库能做？** ✅ 是的，SQLite + 现有技术栈即可

**结论**：扩展现有 Todo 系统，不引入新依赖。

### 架构设计

```
Backend:
server/internal/store/todo.go          # 扩展 Todo 模型
server/internal/store/checkin.go       # 新建打卡记录存储
server/internal/store/schema.go        # 添加 check_ins 表
server/internal/handler/checkin.go     # 新建打卡 API

Frontend:
web/src/pages/CheckInPage.tsx          # 打卡页面
web/src/components/checkin/
  - HabitCard.tsx                      # 习惯卡片
  - CalendarHeatmap.tsx                # 日历热力图
  - StatsCards.tsx                     # 统计卡片
web/src/hooks/useCheckIns.ts          # 打卡数据 hook
web/src/api/checkin.ts                 # 打卡 API 调用
```

### API 设计

```
GET  /api/v1/habits              # 获取所有习惯目标
POST /api/v1/check-ins           # 创建打卡记录
GET  /api/v1/check-ins?habit_id=xxx&month=2026-07  # 获取打卡记录
DELETE /api/v1/check-ins/:id     # 删除打卡记录
GET  /api/v1/habits/:id/stats    # 获取习惯统计数据
```

## Out of Scope

- ❌ 不做社交功能（组队、排行榜）
- ❌ 不做游戏化积分系统
- ❌ 不做智能推荐
- ❌ 不做移动端原生推送
- ❌ 不做数据同步到第三方（如Apple Health）

## Notes

- 优先实现 MVP，确保核心打卡流程顺畅
- 日历热力图是核心视觉元素，参考 GitHub Contributions
- 连胜机制是最重要的激励手段
- 遵循 Ponytail 原则：简单、直接、可扩展
