# 通知中心页面

## Goal

创建独立的通知中心页面，展示完整的通知历史列表，解决首页 Widget 只能显示前 20 条通知的限制。

## Background

**现状**：
- 后端已有完整的通知 API（`/api/v1/notifications`）
- 首页 NotificationWidget 只显示前 20 条通知（`slice(0, 20)`）
- 用户无法查看更多历史通知
- Widget 功能完善：未读计数、标记已读、标记全部已读、清空

**问题**：
- 通知列表被截断，看不全历史记录
- 没有独立页面展示完整通知列表
- 无法搜索或筛选通知

## Requirements

### 1. 通知中心页面 (`/notifications`)

#### 1.1 页面路由
- 路径：`/notifications`
- 创建 `NotificationsPage.tsx` 组件
- 添加到 `App.tsx` 路由配置

#### 1.2 页面布局
- 使用与其他页面一致的布局风格（参考 BlogPage, RSSPage）
- 顶部标题区：显示"通知中心"
- 左侧导航栏保持可见
- 主内容区：通知列表

#### 1.3 通知列表显示
- 显示完整的通知历史（不限制 20 条）
- 支持分页或无限滚动（优先无限滚动）
- 每条通知显示：
  - 图标（根据 type：rss, github, service, pomodoro, system）
  - 标题
  - 消息内容
  - 时间戳（格式：MM-DD HH:mm）
  - 已读/未读状态

#### 1.4 操作功能
- 点击通知标记为已读
- 顶部工具栏：
  - "全部已读" 按钮
  - "清空通知" 按钮
  - 未读计数显示

#### 1.5 筛选与搜索（可选，后续增强）
- 按类型筛选（rss, github, service 等）
- 按已读/未读筛选
- 搜索通知标题和内容

### 2. 首页 Widget 集成

#### 2.1 "查看全部" 链接
- Widget 底部增加"查看全部"链接
- 点击跳转到 `/notifications` 页面

#### 2.2 Widget 保持现有功能
- 继续显示最新 20 条
- 保留未读计数、标记已读、清空等功能

### 3. 导航集成

#### 3.1 侧边栏导航
- 在左侧导航栏增加"通知中心"入口
- 位置建议：放在"首页"附近
- 显示未读计数徽章

## Acceptance Criteria

- [ ] 创建 `/notifications` 路由和 NotificationsPage 组件
- [ ] 页面显示完整通知列表（不限制数量）
- [ ] 支持标记已读、全部已读、清空操作
- [ ] Widget 底部增加"查看全部"链接
- [ ] 侧边栏增加通知中心导航入口
- [ ] 页面样式与项目整体风格一致
- [ ] 移动端响应式布局正常

## Technical Design

### Ponytail 决策阶梯

1. **需要存在吗？** ✅ 是的，这是用户痛点
2. **代码库已有？** ❌ 没有独立页面
3. **标准库能做？** ✅ 是的，React Router + 现有组件即可

**结论**：不需要新依赖，使用现有技术栈。

### 架构设计

```
web/src/pages/NotificationsPage.tsx   # 新建通知中心页面
web/src/App.tsx                        # 添加路由
web/src/components/Layout.tsx          # 侧边栏增加导航项（如有）
web/src/components/widgets/NotificationWidget.tsx  # 增加"查看全部"链接
```

### 数据流

```
NotificationsPage
    ↓
useNotifications hook (已有)
    ↓
/api/v1/notifications?limit=100 (或更大)
    ↓
显示完整列表
```

### UI 参考

参考现有页面的布局：
- 顶部标题栏：类似 BlogPage
- 卡片列表：类似 RSSPage
- 操作按钮：复用 Widget 的设计

## Out of Scope

- ❌ 不做实时通知推送（WebSocket）
- ❌ 不做通知分类管理
- ❌ 不做通知优先级设置
- ❌ 不做桌面/移动端原生推送

## Notes

- 遵循 Ponytail 原则：简单直接，不过度设计
- 复用现有的 `useNotifications` hook
- 保持 UI 风格一致性
- 优先实现核心功能，筛选搜索可后续迭代
