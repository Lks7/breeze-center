import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusDot, type StatusLevel } from "@/components/ui/StatusDot";

/**
 * WidgetCard — Widget 通用外壳
 * 统一的 header（图标 + 标题 + 状态）+ body 容器
 *
 * 传 to 后：header 标题与右上角箭头变成跳转入口（不影响 body 内部交互）
 */

export interface WidgetCardProps {
  title: string;
  icon?: ReactNode;
  status?: StatusLevel;
  /** 卡片在网格中占几列，默认 auto */
  className?: string;
  enterDelay?: number;
  children: ReactNode;
  /** 右上角额外操作区 */
  actions?: ReactNode;
  /** 点击标题跳转的路由路径，留空则不跳 */
  to?: string;
}

export function WidgetCard({
  title,
  icon,
  status,
  className = "",
  enterDelay,
  children,
  actions,
  to,
}: WidgetCardProps) {
  const navigate = useNavigate();

  return (
    <GlassCard enterDelay={enterDelay} className={`flex flex-col ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon && (
          <span className="flex h-6 w-6 items-center justify-center" style={{ color: "var(--accent-primary)" }}>
            {icon}
          </span>
        )}
        {to ? (
          <button
            onClick={() => navigate(to)}
            className="group/title flex items-center gap-1 text-sm font-medium transition"
            style={{ color: "var(--text-secondary)" }}
            title={`查看${title}`}
          >
            <span className="transition group-hover/title:text-[var(--accent-primary)]">
              {title}
            </span>
            <ArrowUpRight
              size={13}
              className="opacity-0 transition group-hover/title:opacity-100"
              style={{ color: "var(--accent-primary)" }}
            />
          </button>
        ) : (
          <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {title}
          </h3>
        )}
        {status && <StatusDot level={status} size={6} className="ml-1" />}
        <div className="ml-auto flex items-center gap-1">
          {actions}
          <button className="btn-ghost !p-1.5" aria-label="刷新" title="刷新">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </GlassCard>
  );
}
