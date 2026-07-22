import gsap from 'gsap';

/**
 * GSAP 动画预设
 */
export const animations = {
  // 淡入
  fadeIn: {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
  },

  // 弹跳缩放
  scaleBounce: {
    keyframes: [
      { scale: 0.9, duration: 0.1 },
      { scale: 1.2, duration: 0.2 },
      { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' },
    ],
  },

  // 快速悬停
  hoverScale: {
    to: { scale: 1.1, duration: 0.2, ease: 'power2.out' },
  },

  // 按下效果
  pressDown: {
    to: { scale: 0.95, duration: 0.1, ease: 'power2.in' },
  },

  // 卡片入场
  cardEnter: {
    from: { opacity: 0, scale: 0.8, y: 30 },
    to: { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' },
  },

  // 卡片退场
  cardExit: {
    to: { opacity: 0, scale: 0.8, y: -30, duration: 0.3, ease: 'power2.in' },
  },
};

/**
 * 快捷动画函数
 */
export const animate = {
  // 点击反馈
  clickFeedback: (element: HTMLElement) => {
    gsap.timeline()
      .to(element, { scale: 0.9, duration: 0.1 })
      .to(element, { scale: 1.2, duration: 0.2 })
      .to(element, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' });
  },

  // 打卡成功动画
  checkInSuccess: (element: HTMLElement) => {
    const tl = gsap.timeline();
    tl.to(element, {
      scale: 1.2,
      rotation: 360,
      duration: 0.5,
      ease: 'back.out(1.7)',
    }).to(element, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)',
    });
  },

  // 悬停效果
  hover: (element: HTMLElement, enter: boolean) => {
    gsap.to(element, {
      scale: enter ? 1.05 : 1,
      y: enter ? -2 : 0,
      duration: 0.2,
      ease: 'power2.out',
    });
  },
};
