import { forwardRef, type HTMLAttributes } from "react";

/**
 * GlassCard — 玻璃卡片外壳
 * 统一的半透明毛玻璃卡片样式，hover 微抬
 */

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** 是否启用 hover 上浮效果，默认 true */
  interactive?: boolean;
  /** 入场动画延迟（ms），用于卡片错落入场 */
  enterDelay?: number;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { interactive = true, enterDelay = 0, className = "", style, children, ...rest },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={`glass-card card-in p-5 ${interactive ? "cursor-default" : ""} ${className}`}
        style={{ animationDelay: `${enterDelay}ms`, ...style }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
