import { type HTMLAttributes } from "react";

/**
 * GradientText — 渐变文字
 * 关键标题使用 accent 渐变
 */

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {}

export function GradientText({ className = "", children, ...rest }: GradientTextProps) {
  return (
    <span className={`gradient-text ${className}`} {...rest}>
      {children}
    </span>
  );
}
