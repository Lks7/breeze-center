# GSAP 动画应用规划

## 核心原则
- GSAP 用于精确控制、高性能场景
- Framer Motion 保留用于 React 组件级动画
- 避免重复动画库功能

## 应用场景

### Phase 1: 页面合并
1. **HabitCard 入场动画**
   - 使用 `gsap.from()` + stagger 实现卡片依次淡入
   - 缓动：`power2.out`
   
2. **打卡按钮交互**
   - 点击时：scale(0.9) → scale(1.2) → scale(1)
   - 使用 `gsap.timeline()` 编排
   - 添加旋转和颜色渐变

### Phase 2: 进度总览
1. **CompletionRing（环形进度）**
   - SVG `stroke-dashoffset` 动画
   - 从 0% → 目标百分比
   - 缓动：`power3.inOut`
   - 持续时间：1.5s
   
2. **统计数字滚动**
   - 连胜天数、最长连胜等数字的 CountUp 效果
   - 使用 `gsap.to()` + `onUpdate` 回调
   - 缓动：`expo.out`

### Phase 3: 日历增强
1. **日历方块交互**
   - hover 时：scale(1.1) + 阴影增强
   - 点击时：scale(0.95) → scale(1.05) → scale(1)
   - 使用 `gsap.to()` 快速响应
   
2. **补打卡/取消打卡动画**
   - 成功后：方块变色 + 弹跳效果
   - 使用 `elastic.out` 缓动

### Phase 4: 习惯详情面板
1. **模态框弹出**
   - 背景遮罩：opacity 0 → 0.5
   - 面板：scale(0.8) + opacity(0) → scale(1) + opacity(1)
   - 使用 `gsap.timeline()` 协调两者
   - 缓动：`back.out` （带回弹效果）
   
2. **趋势图动画**
   - 折线/柱状图从左到右绘制
   - 使用 `stroke-dasharray` 或 width 动画

### Phase 5: TodoWidget 增强
1. **习惯列表更新动画**
   - 新增习惯：从顶部滑入
   - 删除习惯：淡出 + 高度收缩
   - 使用 `gsap.timeline()` 编排

## 技术实现

### 1. 创建通用 Hook
```typescript
// hooks/useGSAPAnimation.ts
export const useCountUp = (target: number, duration: number) => {...}
export const useStaggerIn = (selector: string) => {...}
export const useScaleBounce = () => {...}
```

### 2. 创建动画预设
```typescript
// utils/gsapPresets.ts
export const animations = {
  fadeIn: { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' },
  scaleBounce: { scale: [0.9, 1.2, 1], duration: 0.4, ease: 'elastic.out' },
  // ...
}
```

### 3. 在组件中应用
- 使用 `useGSAP` hook (GSAP 官方推荐的 React hook)
- 在 `useEffect` 或 `useLayoutEffect` 中初始化动画
- 清理函数中调用 `gsap.killTweensOf()`

## 性能优化
- 使用 `will-change` CSS 提示浏览器优化
- 避免同时运行大量动画（使用 stagger）
- 使用 `gsap.set()` 预设初始状态
- 在动画完成后移除 `will-change`

## 验证方式
- 在 Chrome DevTools Performance 中检查 FPS
- 确保动画流畅（60fps）
- 检查是否有布局抖动（layout thrashing）
