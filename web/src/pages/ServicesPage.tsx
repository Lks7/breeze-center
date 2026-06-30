import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Server, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { StatusDot } from "@/components/ui/StatusDot";
import { serviceAPI } from "@/api/admin";
import type { ServiceEntry } from "@/types/entities";

// 分类展示名映射（与后端 handler/services.go 的 categoryDisplayName 对齐）
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

const STATUS_LABEL: Record<ServiceEntry["status"], string> = {
  active: "运行中",
  inactive: "已停用",
  error: "异常",
};

export function ServicesPage() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", "list"],
    queryFn: serviceAPI.list,
  });

  // 按分类分组（保持 CATEGORY_ORDER 顺序，未识别的分类追加到末尾）
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

  const total = services.length;
  const activeCount = services.filter((s) => s.status === "active").length;
  const errorCount = services.filter((s) => s.status === "error").length;
  const inactiveCount = services.filter((s) => s.status === "inactive").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      {/* 顶部 */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="btn-ghost"
          style={{ border: "1px solid var(--border-card)" }}
        >
          <ArrowLeft size={15} />
          首页
        </Link>
        <h1 className="text-2xl font-semibold">
          <GradientText>服务中心</GradientText>
        </h1>
        <Link
          to="/admin/services"
          className="btn-ghost ml-auto"
          style={{ border: "1px solid var(--border-card)" }}
          title="管理服务"
        >
          <Server size={14} />
          管理
        </Link>
      </div>

      {/* 摘要条 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="服务总数" value={total} />
        <SummaryCard
          label="运行中"
          value={activeCount}
          color="var(--status-ok)"
        />
        <SummaryCard
          label="异常"
          value={errorCount}
          color="var(--status-error)"
        />
        <SummaryCard
          label="已停用"
          value={inactiveCount}
          color="var(--text-muted)"
        />
      </div>

      {/* 内容 */}
      {isLoading ? (
        <div
          className="flex items-center gap-2 py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : total === 0 ? (
        <GlassCard interactive={false} className="py-16 text-center">
          <Server
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            还没有服务实例
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            前往{" "}
            <Link
              to="/admin/services"
              className="underline"
              style={{ color: "var(--accent-primary)" }}
            >
              管理后台
            </Link>{" "}
            添加你的第一个服务
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {orderedCategories.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              items={grouped.get(cat) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 摘要卡片
// ============================================================

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <GlassCard interactive={false} className="!p-4">
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="count-rise mt-1 font-mono text-2xl font-bold tabular-nums"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </GlassCard>
  );
}

// ============================================================
// 分类区段
// ============================================================

function CategorySection({
  category,
  items,
}: {
  category: string;
  items: ServiceEntry[];
}) {
  const label = CATEGORY_LABEL[category] ?? category;
  const activeInCat = items.filter((s) => s.status === "active").length;

  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          {label}
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {activeInCat}/{items.length} 运行中
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// 服务卡片
// ============================================================

function ServiceCard({ service }: { service: ServiceEntry }) {
  const isActive = service.status === "active";
  const isStopped = service.status === "inactive";

  return (
    <GlassCard className="group flex flex-col gap-3 !p-5">
      {/* 头部：图标 + 名称 + 状态 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: `${service.icon_color}22`,
              color: service.icon_color,
            }}
          >
            <Server size={20} />
          </span>
          <div>
            <h3
              className="text-base font-medium transition group-hover:text-[var(--accent-primary)]"
              style={{ color: "var(--text-primary)" }}
            >
              {service.name}
            </h3>
            {service.description && (
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {service.description}
              </p>
            )}
          </div>
        </div>
        <StatusDot
          level={
            isActive ? "ok" : service.status === "error" ? "error" : "idle"
          }
          size={8}
        />
      </div>

      {/* URL */}
      {service.url && (
        <div
          className="flex items-center gap-1.5 truncate text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          <ExternalLink size={11} style={{ color: "var(--text-muted)" }} />
          <span className="truncate" title={service.url}>
            {service.url.replace(/^https?:\/\//, "")}
          </span>
        </div>
      )}

      {/* 底部：状态标签 + 访问按钮 */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span
          className="rounded px-2 py-0.5 text-[10px]"
          style={{
            background: isActive
              ? "color-mix(in srgb, var(--status-ok) 18%, transparent)"
              : service.status === "error"
                ? "color-mix(in srgb, var(--status-error) 18%, transparent)"
                : "var(--bg-card)",
            color: isActive
              ? "var(--status-ok)"
              : service.status === "error"
                ? "var(--status-error)"
                : "var(--text-muted)",
          }}
        >
          {STATUS_LABEL[service.status]}
        </span>

        {service.url && (
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition hover:opacity-90"
            style={{
              background: isActive
                ? "var(--accent-gradient)"
                : "var(--bg-card)",
              color: isActive ? "#fff" : "var(--text-muted)",
              cursor: isStopped ? "not-allowed" : "pointer",
            }}
            aria-disabled={isStopped}
            onClick={(e) => {
              if (isStopped) e.preventDefault();
            }}
          >
            访问
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </GlassCard>
  );
}
