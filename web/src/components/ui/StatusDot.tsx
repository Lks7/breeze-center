import { type HTMLAttributes } from "react";

/**
 * StatusDot — 状态指示器
 * 用于服务在线状态展示，支持 ok/warn/error 三态
 */

export type StatusLevel = "ok" | "warn" | "error" | "idle";

const COLOR_MAP: Record<StatusLevel, string> = {
  ok: "var(--status-ok)",
  warn: "var(--status-warn)",
  error: "var(--status-error)",
  idle: "var(--text-muted)",
};

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  level?: StatusLevel;
  /** 是否显示脉冲动画，默认 true */
  pulse?: boolean;
  size?: number;
}

export function StatusDot({
  level = "ok",
  pulse = true,
  size = 8,
  className = "",
  style,
  ...rest
}: StatusDotProps) {
  const color = COLOR_MAP[level];
  return (
    <span
      className={`relative inline-flex shrink-0 ${pulse && level !== "idle" ? "status-pulse" : ""} ${className}`}
      style={{ color, ...style }}
      {...rest}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  );
}
