/**
 * ServiceShelf — 服务快捷架
 *
 * 贴在 TopBar 下方的一行极薄服务入口条。
 * 像浏览器的收藏栏一样始终可见（随 TopBar sticky）。
 * 紧凑图标 + 状态点 + 名称，水平滚动。
 */

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { serviceAPI } from "@/api/admin";

/**
 * 服务架 — 自动获取服务列表展示
 * 渲染在 TopBar 下方，继承其 sticky 属性。
 */
export function ServiceShelf() {
  const navigate = useNavigate();

  const { data: services = [] } = useQuery({
    queryKey: ["service-shelf", "services"],
    queryFn: serviceAPI.list,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // 5分钟自动刷新状态
  });

  // 没服务时不显示
  if (services.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto px-4 py-1 scrollbar-none"
      style={{
        borderBottom: "1px solid var(--border-card)",
        background:
          "color-mix(in srgb, var(--bg-primary) 60%, transparent)",
        maxHeight: "34px",
        minHeight: "34px",
      }}
    >
      {/* 每个服务一个胶囊 */}
      {services.map((svc) => (
        <button
          key={svc.id}
          onClick={() =>
            window.open(svc.url, "_blank", "noopener")
          }
          className="group flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]"
          style={{ color: "var(--text-secondary)" }}
          title={`${svc.name}${svc.description ? ` — ${svc.description}` : ""}`}
        >
          {/* 状态点 */}
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background:
                svc.status === "active"
                  ? "var(--status-success)"
                  : svc.status === "error"
                    ? "var(--status-error)"
                    : "var(--text-muted)",
            }}
          />
          {/* 服务名 */}
          <span className="truncate max-w-[80px] group-hover:text-[var(--accent-primary)] transition-colors">
            {svc.name}
          </span>
          {/* 外链图标（hover 显示） */}
          <ExternalLink
            size={10}
            className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          />
        </button>
      ))}

      {/* 添加服务按钮 */}
      <button
        onClick={() => navigate("/admin")}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)]"
        style={{ color: "var(--text-muted)" }}
        title="添加服务"
      >
        <Plus size={12} />
        <span className="hidden sm:inline">添加</span>
      </button>
    </div>
  );
}
