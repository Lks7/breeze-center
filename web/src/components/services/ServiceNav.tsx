import {
  Server,
  BookText,
  GitBranch,
  HardDrive,
  Activity,
  Newspaper,
  Bookmark,
  Music,
  Calendar,
  CheckSquare,
  Github,
  type LucideIcon,
} from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import type { ServiceEntry } from "@/types/entities";

// icon_name 字符串 → lucide 组件。未知图标 fallback 到 Server。
const ICON_MAP: Record<string, LucideIcon> = {
  server: Server,
  "book-text": BookText,
  "git-branch": GitBranch,
  "hard-drive": HardDrive,
  activity: Activity,
  newspaper: Newspaper,
  bookmark: Bookmark,
  music: Music,
  calendar: Calendar,
  "check-square": CheckSquare,
  github: Github,
};

// 分类展示名（与 /services 页面保持一致）
const CATEGORY_LABEL: Record<string, string> = {
  content: "内容创作",
  "self-hosted": "自建服务",
  data: "数据仪表",
  plan: "计划管理",
  subscription: "信息订阅",
  entertainment: "娱乐",
};

const CATEGORY_ORDER = [
  "self-hosted",
  "content",
  "data",
  "subscription",
  "plan",
  "entertainment",
];

function statusLevel(s: ServiceEntry["status"]): "ok" | "error" | "idle" {
  if (s === "active") return "ok";
  if (s === "error") return "error";
  return "idle";
}

/**
 * ServiceNav — 服务导航门户区
 * 按分类展示所有已接入服务的入口卡片，数据来自父组件传入的 services 列表。
 */
export function ServiceNav({
  enterDelay = 0,
  services = [],
}: {
  enterDelay?: number;
  services?: ServiceEntry[];
}) {
  if ((services || []).length === 0) return null;

  // 按分类分组
  const grouped = new Map<string, ServiceEntry[]>();
  for (const s of services) {
    const arr = grouped.get(s.category) ?? [];
    arr.push(s);
    grouped.set(s.category, arr);
  }
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <section className="card-in mt-8" style={{ animationDelay: `${enterDelay}ms` }}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          🧭 快捷导航
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {(services || []).length} 个服务
        </span>
      </div>

      <div className="space-y-6">
        {orderedCategories.map((cat) => {
          const items = grouped.get(cat) ?? [];
          return (
            <div key={cat}>
              <h3
                className="mb-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {CATEGORY_LABEL[cat] ?? cat}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {items.map((svc) => {
                  const Icon = ICON_MAP[svc.icon_name] ?? Server;
                  return (
                    <a
                      key={svc.id}
                      href={svc.url || "#"}
                      target={svc.url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="glass-card group flex flex-col gap-2 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{
                            background: `${svc.icon_color}22`,
                            color: svc.icon_color,
                          }}
                        >
                          <Icon size={18} />
                        </span>
                        {svc.status !== "inactive" && (
                          <StatusDot level={statusLevel(svc.status)} size={6} />
                        )}
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium transition group-hover:text-[var(--accent-primary)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {svc.name}
                        </p>
                        <p
                          className="mt-0.5 truncate text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {svc.description || svc.url?.replace(/^https?:\/\//, "") || "—"}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
