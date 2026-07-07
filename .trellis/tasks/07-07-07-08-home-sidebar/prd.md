# 首页侧边栏导航

## Goal

在首页增加左侧边栏导航，将基金、快捷导航、融合站点、订阅等页面入口统一收纳，方便用户快速切换。

## Background

当前首页是全宽布局，所有 widget 通过 CSS columns 排列。页面切换需要点击 TopBar 菜单或手动输入 URL，缺少一个统一的导航入口。

## Requirements

### 1. 左侧边栏

- 固定在左侧，不随滚动移动
- 半透明磨砂背景，与现有设计风格一致
- 宽度约 56px（收拢图标模式）
- 包含 Logo 和主要导航图标

### 2. 导航项目

- 首页（Home）
- 基金盈亏（/fund）- 增加红涨绿跌指示
- 快捷导航（/services）- 服务列表
- 融合站点（/fusion）
- RSS 订阅（/rss）
- 待办计划（/plans）
- 书签（/bookmarks）
- 打卡（/check-in）
- 通知中心（/notifications）
- GitHub（/github）
- 博客（/blog）
- 文件中心（/files）

### 3. 底部操作

- 主题切换（暗色/亮色）
- 后台管理入口（/admin）
- 首页设置按钮

### 4. 布局调整

- 首页由全宽布局改为 `sidebar + main-content` 布局
- 主内容区左移，留出 sidebar 空间
- 移动端侧边栏折叠为汉堡菜单

## Acceptance Criteria

- [ ] 侧边栏显示所有主要导航项（带图标）
- [ ] 点击导航项跳转到对应页面
- [ ] 当前页面高亮
- [ ] 底部有主题切换、后台管理、设置入口
- [ ] 移动端折叠为汉堡菜单
- [ ] 布局适配 sidebar 宽度
