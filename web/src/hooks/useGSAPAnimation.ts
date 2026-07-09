import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';

/**
 * 数字滚动效果
 */
export function useCountUp(
  target: number,
  duration: number = 1.5,
  onUpdate?: (value: number) => void
) {
  const valueRef = useRef({ value: 0 });

  useEffect(() => {
    gsap.to(valueRef.current, {
      value: target,
      duration,
      ease: 'expo.out',
      onUpdate: () => {
        onUpdate?.(Math.floor(valueRef.current.value));
      },
    });

    return () => {
      gsap.killTweensOf(valueRef.current);
    };
  }, [target, duration, onUpdate]);

  return valueRef;
}

/**
 * 依次淡入效果（适用于列表）
 */
export function useStaggerIn(selector: string, deps: any[] = []) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;

    gsap.fromTo(
      elements,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      }
    );

    return () => {
      gsap.killTweensOf(elements);
    };
  }, deps);
}

/**
 * 弹跳缩放效果
 */
export function useScaleBounce<T extends HTMLElement = HTMLElement>(elementRef: RefObject<T | null>) {
  const trigger = () => {
    if (!elementRef.current) return;

    gsap.timeline()
      .to(elementRef.current, {
        scale: 0.9,
        duration: 0.1,
        ease: 'power2.in',
      })
      .to(elementRef.current, {
        scale: 1.2,
        duration: 0.2,
        ease: 'power2.out',
      })
      .to(elementRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'elastic.out(1, 0.5)',
      });
  };

  return trigger;
}

/**
 * 环形进度动画
 */
export function useRingProgress(
  targetPercent: number,
  duration: number = 1.5
) {
  const progressRef = useRef({ percent: 0 });

  useEffect(() => {
    gsap.to(progressRef.current, {
      percent: targetPercent,
      duration,
      ease: 'power3.inOut',
    });

    return () => {
      gsap.killTweensOf(progressRef.current);
    };
  }, [targetPercent, duration]);

  return progressRef;
}

/**
 * 模态框弹出动画
 */
export function useModalAnimation(
  isOpen: boolean,
  overlayRef: RefObject<HTMLElement>,
  panelRef: RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;

    if (isOpen) {
      const tl = gsap.timeline();
      tl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      ).fromTo(
        panelRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: 'back.out(1.7)',
        },
        '-=0.1'
      );
    } else {
      const tl = gsap.timeline();
      tl.to(panelRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      }).to(
        overlayRef.current,
        { opacity: 0, duration: 0.2, ease: 'power2.in' },
        '-=0.1'
      );
    }

    return () => {
      gsap.killTweensOf([overlayRef.current, panelRef.current]);
    };
  }, [isOpen, overlayRef, panelRef]);
}
