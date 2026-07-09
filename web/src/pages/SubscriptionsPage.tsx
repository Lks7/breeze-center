import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  Loader2,
  Plus,
  Trash2,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { subscriptionAPI, type Subscription } from "@/api/subscription";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Filter = "all" | "normal" | "expiring" | "expired";

interface SubscriptionForm {
  name: string;
  type: string;
  provider: string;
  expire_date: string;
  price: number;
  cycle: string;
  description: string;
  notify_days: number;
}

const TYPE_COLORS: Record<string, string> = {
  "服务器": "#ef4444",
  "域名": "#8b5cf6",
  "VPN": "#06b6d4",
  "会员": "#f59e0b",
  "软件": "#10b981",
  "云服务": "#3b82f6",
  "其他": "#6b7280",
};

const TYPE_OPTIONS = Object.keys(TYPE_COLORS);
const CYCLE_OPTIONS = ["月付", "季付", "年付", "永久", "一次性"];

const emptyForm: SubscriptionForm = {
  name: "",
  type: "会员",
  provider: "",
  expire_date: "",
  price: 0,
  cycle: "月付",
  description: "",
  notify_days: 7,
};

export function SubscriptionsPage() {
  const qc = useQueryClient();
  const pageRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState<SubscriptionForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [formError, setFormError] = useState("");

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["subscriptions", "list"],
    queryFn: subscriptionAPI.list,
  });

  const createMutation = useMutation({
    mutationFn: (body: SubscriptionForm) => subscriptionAPI.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: SubscriptionForm }) =>
      subscriptionAPI.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subscriptionAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      setDeleteTarget(null);
    },
  });

  const stats = useMemo(() => {
    const expired = subscriptions.filter((item) => daysLeft(item.expire_date) < 0).length;
    const expiring = subscriptions.filter((item) => {
      const days = daysLeft(item.expire_date);
      return days >= 0 && days <= 30;
    }).length;
    const monthly = subscriptions.reduce((sum, item) => sum + monthlyCost(item), 0);
    return { total: subscriptions.length, expired, expiring, monthly };
  }, [subscriptions]);

  const types = useMemo(
    () => [...new Set(subscriptions.map((item) => item.type).filter(Boolean))].sort(),
    [subscriptions]
  );

  const filtered = useMemo(() => {
    return subscriptions
      .filter((item) => {
        const days = daysLeft(item.expire_date);
        if (filter === "expired") return days < 0;
        if (filter === "expiring") return days >= 0 && days <= 30;
        if (filter === "normal") return days > 30;
        return true;
      })
      .filter((item) => typeFilter === "all" || item.type === typeFilter)
      .sort((a, b) => daysLeft(a.expire_date) - daysLeft(b.expire_date));
  }, [filter, subscriptions, typeFilter]);

  useEffect(() => {
    if (!pageRef.current || isLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-sub-animate]",
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: "power3.out",
          stagger: 0.045,
        }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [filter, filtered.length, isLoading, typeFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item: Subscription) {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type || "会员",
      provider: item.provider,
      expire_date: item.expire_date.slice(0, 10),
      price: item.price,
      cycle: item.cycle || "月付",
      description: item.description,
      notify_days: item.notify_days || 7,
    });
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError("");
  }

  function submitForm() {
    if (!form.name.trim()) {
      setFormError("请输入订阅名称");
      return;
    }
    if (!form.expire_date) {
      setFormError("请选择到期日期");
      return;
    }
    const payload = { ...form, name: form.name.trim(), provider: form.provider.trim() };
    if (editing) {
      updateMutation.mutate({ id: editing.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div ref={pageRef} className="mx-auto w-full max-w-7xl px-6 py-6">
      <header data-sub-animate className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <CreditCard size={15} />
            订阅中心
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            订阅、续费和到期提醒
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
          style={{ background: "var(--accent-gradient)" }}
        >
          <Plus size={16} />
          添加订阅
        </button>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={WalletCards} label="全部订阅" value={stats.total.toString()} />
        <StatCard icon={AlertTriangle} label="30 天内到期" value={stats.expiring.toString()} tone="warn" />
        <StatCard icon={Clock3} label="已过期" value={stats.expired.toString()} tone="danger" />
        <StatCard icon={CreditCard} label="月均支出" value={`¥${stats.monthly.toFixed(0)}`} tone="ok" />
      </section>

      <GlassCard data-sub-animate interactive={false} className="mb-5 flex flex-wrap items-center gap-2 !p-3">
        {[
          ["all", "全部"],
          ["normal", "正常"],
          ["expiring", "即将到期"],
          ["expired", "已过期"],
        ].map(([value, label]) => (
          <FilterButton
            key={value}
            active={filter === value}
            onClick={() => setFilter(value as Filter)}
          >
            {label}
          </FilterButton>
        ))}
        <span className="mx-1 h-5 w-px" style={{ background: "var(--border-card)" }} />
        <FilterButton active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
          全部类型
        </FilterButton>
        {types.map((type) => (
          <FilterButton key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
            {type}
          </FilterButton>
        ))}
      </GlassCard>

      {isLoading ? (
        <div className="flex items-center gap-2 py-16 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={15} className="animate-spin" />
          加载中...
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard data-sub-animate interactive={false} className="py-16 text-center">
          <CalendarClock size={34} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            当前没有匹配的订阅
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white"
            style={{ background: "var(--accent-gradient)" }}
          >
            <Plus size={14} />
            添加订阅
          </button>
        </GlassCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <SubscriptionCard
              key={item.id}
              subscription={item}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <SubscriptionFormModal
          form={form}
          editing={!!editing}
          error={formError}
          saving={saving}
          onChange={setForm}
          onClose={closeForm}
          onSubmit={submitForm}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除订阅"
        message={`确定删除「${deleteTarget?.name ?? ""}」吗？`}
        confirmLabel={deleteMutation.isPending ? "删除中..." : "删除"}
        cancelLabel="取消"
        variant="danger"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "warn" | "danger" | "ok";
}) {
  const color =
    tone === "danger" ? "var(--status-error)" :
    tone === "warn" ? "var(--status-warn)" :
    tone === "ok" ? "var(--status-ok)" :
    "var(--accent-primary)";

  return (
    <GlassCard data-sub-animate interactive={false} className="!p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
          <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
        >
          <Icon size={19} />
        </div>
      </div>
    </GlassCard>
  );
}

function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
}: {
  subscription: Subscription;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getStatus(subscription.expire_date);
  const color = TYPE_COLORS[subscription.type] || TYPE_COLORS["其他"];

  return (
    <GlassCard data-sub-animate className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: `${color}20`, color }}
          >
            {subscription.type.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {subscription.name}
            </h3>
            <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {subscription.provider || "未填写提供商"} · {subscription.price > 0 ? `¥${subscription.price}/${subscription.cycle}` : "免费"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onEdit} className="btn-ghost !p-1.5" title="编辑">
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="btn-ghost !p-1.5"
            title="删除"
            style={{ color: "var(--status-error)" }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium"
          style={{ background: status.bg, color: status.color }}
        >
          {status.icon}
          {status.label}
        </span>
        <span className="inline-flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <CalendarClock size={12} />
          {subscription.expire_date.slice(0, 10)}
        </span>
        <span className="inline-flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <Bell size={12} />
          提前 {subscription.notify_days} 天提醒
        </span>
      </div>

      {subscription.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {subscription.description}
        </p>
      )}
    </GlassCard>
  );
}

function SubscriptionFormModal({
  form,
  editing,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  form: SubscriptionForm;
  editing: boolean;
  error: string;
  saving: boolean;
  onChange: (form: SubscriptionForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, y: 18, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, ease: "power2.out" }
    );
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={panelRef}
        className="glass-card w-full max-w-2xl !p-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--border-card)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {editing ? "编辑订阅" : "添加订阅"}
            </h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              记录续费日期、费用和提醒周期
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost !p-1.5">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Field label="名称 *">
            <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="subscription-input" placeholder="Netflix / 域名 / VPS" />
          </Field>
          <Field label="类型">
            <select value={form.type} onChange={(e) => onChange({ ...form, type: e.target.value })} className="subscription-input">
              {TYPE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="提供商">
            <input value={form.provider} onChange={(e) => onChange({ ...form, provider: e.target.value })} className="subscription-input" placeholder="Google / Cloudflare" />
          </Field>
          <Field label="到期日期 *">
            <input type="date" value={form.expire_date} onChange={(e) => onChange({ ...form, expire_date: e.target.value })} className="subscription-input" />
          </Field>
          <Field label="价格">
            <input type="number" min={0} value={form.price || ""} onChange={(e) => onChange({ ...form, price: Number(e.target.value) })} className="subscription-input" placeholder="0" />
          </Field>
          <Field label="周期">
            <select value={form.cycle} onChange={(e) => onChange({ ...form, cycle: e.target.value })} className="subscription-input">
              {CYCLE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="提前提醒">
            <select value={form.notify_days} onChange={(e) => onChange({ ...form, notify_days: Number(e.target.value) })} className="subscription-input">
              {[3, 7, 15, 30, 60].map((days) => <option key={days} value={days}>{days} 天</option>)}
            </select>
          </Field>
          <Field label="备注">
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="subscription-input min-h-20 resize-none" placeholder="账号、用途、续费说明..." />
          </Field>
        </div>

        {error && <p className="px-5 pb-2 text-xs" style={{ color: "var(--status-error)" }}>{error}</p>}

        <div className="flex justify-end gap-2 border-t p-5" style={{ borderColor: "var(--border-card)" }}>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ border: "1px solid var(--border-card)" }}>
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--accent-gradient)" }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editing ? "保存修改" : "创建订阅"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-2.5 py-1 text-xs transition"
      style={{
        border: "1px solid var(--border-card)",
        background: active ? "var(--accent-primary)" : "var(--bg-card)",
        color: active ? "white" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function getStatus(date: string) {
  const days = daysLeft(date);
  if (days < 0) {
    return {
      label: `已过期 ${Math.abs(days)} 天`,
      color: "var(--status-error)",
      bg: "color-mix(in srgb, var(--status-error) 12%, transparent)",
      icon: <AlertTriangle size={12} />,
    };
  }
  if (days <= 7) {
    return {
      label: `${days} 天后到期`,
      color: "#f97316",
      bg: "rgba(249,115,22,0.12)",
      icon: <AlertTriangle size={12} />,
    };
  }
  if (days <= 30) {
    return {
      label: `${days} 天后到期`,
      color: "var(--status-warn)",
      bg: "color-mix(in srgb, var(--status-warn) 12%, transparent)",
      icon: <Clock3 size={12} />,
    };
  }
  return {
    label: "正常",
    color: "var(--status-ok)",
    bg: "color-mix(in srgb, var(--status-ok) 12%, transparent)",
    icon: <CheckCircle2 size={12} />,
  };
}

function daysLeft(date: string): number {
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.ceil((time - Date.now()) / 86_400_000);
}

function monthlyCost(item: Subscription): number {
  if (!item.price) return 0;
  if (item.cycle === "年付") return item.price / 12;
  if (item.cycle === "季付") return item.price / 3;
  if (item.cycle === "月付") return item.price;
  return 0;
}
