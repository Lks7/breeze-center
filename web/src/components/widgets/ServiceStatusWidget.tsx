import { Server } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { StatusDot, type StatusLevel } from "@/components/ui/StatusDot";
import type { ServiceEntry } from "@/types/entities";

// 数据库 status 字段映射到 StatusDot 的级别
function statusLevel(s: ServiceEntry["status"]): StatusLevel {
  if (s === "active") return "ok";
  if (s === "error") return "error";
  return "idle"; // inactive
}

/**
 * ServiceStatusWidget — 自建服务状态板（来自本地 services 表）
 */
export function ServiceStatusWidget({
  enterDelay,
  services = [],
  to = "/services",
}: {
  enterDelay?: number;
  services?: ServiceEntry[];
  to?: string;
}) {
  const activeCount = services.filter((s) => s.status === "active").length;
  const errorCount = services.filter((s) => s.status === "error").length;

  // 整体状态：有 error 就是 warn，否则按多数正常显示 ok
  const overall: StatusLevel = errorCount > 0 ? "warn" : "ok";

  return (
    <WidgetCard
      title="服务状态"
      icon={<Server size={16} />}
      status={overall}
      enterDelay={enterDelay}
      to={to}
    >
      {services.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          暂无服务实例
        </p>
      ) : (
        <>
          <div
            className="mb-3 flex items-center gap-2 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <StatusDot level={overall} size={6} />
            <span>
              {activeCount}/{services.length} 服务运行正常
            </span>
          </div>
          <ul className="space-y-1.5">
            {services.slice(0, 6).map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[var(--bg-card-hover)]"
              >
                <StatusDot level={statusLevel(s.status)} size={7} />
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {s.name}
                </span>
                <span
                  className="ml-auto truncate font-mono text-xs"
                  style={{ color: "var(--text-muted)" }}
                  title={s.url}
                >
                  {s.url ? s.url.replace(/^https?:\/\//, "") : "—"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </WidgetCard>
  );
}
