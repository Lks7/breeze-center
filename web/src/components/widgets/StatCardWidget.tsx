import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { WidgetCard } from "./WidgetCard";

/**
 * StatCardWidget — 统计数值卡片
 * 数字 + 趋势 + 描述
 */

export interface StatCardWidgetProps {
  title: string;
  icon: LucideIcon;
  value: number | string;
  unit?: string;
  trend?: number; // 正数上升，负数下降
  trendLabel?: string;
  status?: "ok" | "warn" | "error" | "idle";
  enterDelay?: number;
  /** 点击标题跳转的路由路径 */
  to?: string;
}

export function StatCardWidget({
  title,
  icon: Icon,
  value,
  unit,
  trend,
  trendLabel,
  status,
  enterDelay,
  to,
}: StatCardWidgetProps) {
  const up = (trend ?? 0) >= 0;
  return (
    <WidgetCard
      title={title}
      icon={<Icon size={16} />}
      status={status}
      enterDelay={enterDelay}
      to={to}
    >
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className="count-rise font-mono text-3xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {unit}
              </span>
            )}
          </div>
          {trend !== undefined && (
            <div
              className="mt-1 flex items-center gap-1 text-xs"
              style={{ color: up ? "var(--status-ok)" : "var(--status-error)" }}
            >
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>
                {up ? "+" : ""}
                {trend}% {trendLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
