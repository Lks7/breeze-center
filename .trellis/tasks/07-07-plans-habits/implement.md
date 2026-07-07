# 实施计划：目标管理中心

## 实施顺序

### Phase 1: 页面合并（将打卡嵌入 PlansPage）
- [ ] 重构 PlansPage：增加今日打卡 section、进度总览 section、日历 section
- [ ] 从 CheckInPage 迁移 HabitCard / CalendarHeatmap / StatsCards 组件
- [ ] 精简 CheckInPage 为快捷入口（复用 PlansPage 的组件）
- [ ] 验证：PlansPage 显示打卡区，打卡功能正常

### Phase 2: 进度总览
- [ ] 新增 CompletionRing 组件（SVG 环形进度）
- [ ] 在 PlansPage 增加进度卡片：整体完成率、各习惯状态
- [ ] 验证：进度正确显示

### Phase 3: 日历增强
- [ ] 后端：新增 DeleteByDate API
- [ ] CalendarHeatmap 增加点击交互：已打卡→取消，未打卡→补打卡
- [ ] 验证：点击日历日期可补打卡/取消打卡

### Phase 4: 习惯详情面板
- [ ] 新增 HabitDetailPanel 组件（模态框）
- [ ] 显示打卡记录列表 + 趋势
- [ ] 验证：点击习惯打开详情面板

### Phase 5: TodoWidget 增强
- [ ] TodoWidget 增加今日待打卡习惯展示
- [ ] 验证：首页 Widget 正确显示待打卡习惯

## 每次 Phase 验证方式

```bash
# 后端编译
cd server && go build -o bin/server.exe ./cmd/server
# 前端类型检查
cd web && npx tsc --noEmit
```

## 回滚点

每次 Phase 完成后 commit，便于回滚：
- Phase 1: `feat: merge check-in into plans page`
- Phase 2: `feat: add progress overview to plans page`
- Phase 3: `feat: enhance calendar with make-up check-in`
- Phase 4: `feat: add habit detail panel`
- Phase 5: `feat: enhance TodoWidget with habits`
