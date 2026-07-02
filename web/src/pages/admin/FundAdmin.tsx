import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  AlertCircle,
} from "lucide-react";
import { fundAPI } from "@/api/admin";
import { APIError } from "@/api/client";
import type {
  FundHolding,
  FundHoldingInput,
  FundSummary,
  FundNavUpdateResult,
} from "@/types/entities";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * FundAdmin — 基金持仓管理页面
 *
 * 不复用通用 AdminPage（它只能展示一行摘要），而是手写一个完整页面：
 *  - 顶部总盈亏统计卡片
 *  - 中间表格列出每只基金的完整数据
 *  - 每行支持：单条更新净值 / 编辑 / 删除
 *  - 顶部按钮：批量更新净值 / 新建
 *
 * 红涨绿跌（中文市场约定）
 */
export function FundAdmin() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FundHolding | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FundHolding | null>(null);
  const [batchResult, setBatchResult] = useState<FundNavUpdateResult[] | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const queryKey = ["admin", "fund"];
  const summaryKey = ["admin", "fund", "summary"];

  const { data: holdings = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: fundAPI.listHoldings,
  });

  const { data: summary } = useQuery({
    queryKey: summaryKey,
    queryFn: fundAPI.getSummary,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: summaryKey });
  };

  // 单条更新净值
  const updateOneMutation = useMutation({
    mutationFn: fundAPI.updateOneNav,
    onMutate: (id) => {
      const target = holdings.find((h) => h.id === id);
      setUpdatingCode(target?.code ?? null);
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setUpdatingCode(null),
  });

  // 批量更新净值
  const updateAllMutation = useMutation({
    mutationFn: fundAPI.updateNavs,
    onSuccess: (resp) => {
      setBatchResult(resp.results);
      invalidateAll();
    },
  });

  // 创建 / 编辑
  const saveMutation = useMutation({
    mutationFn: async (body: FundHoldingInput) => {
      if (editing) return fundAPI.updateHolding(editing.id, body);
      return fundAPI.createHolding(body);
    },
    onSuccess: () => {
      invalidateAll();
      closeForm();
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: fundAPI.deleteHolding,
    onSuccess: () => {
      invalidateAll();
      setDeleteTarget(null);
    },
  });

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(item: FundHolding) {
    setEditing(item);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="px-8 py-6 space-y-5">
      {/* 顶部标题与操作 */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            基金持仓管理
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            管理基金持仓，一键抓取最新净值，自动计算盈亏
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateAllMutation.mutate()}
            disabled={updateAllMutation.isPending || holdings.length === 0}
            className="glass-card inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "var(--text-primary)" }}
          >
            {updateAllMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {updateAllMutation.isPending ? "抓取中..." : "批量更新净值"}
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: "var(--accent-gradient)" }}
          >
            <Plus size={15} />
            新建持仓
          </button>
        </div>
      </header>

      {/* 总盈亏统计 */}
      <SummaryGrid summary={summary} />

      {/* 错误提示 */}
      {error && (
        <ErrorBanner message={`加载失败：${(error as APIError).message ?? String(error)}`} />
      )}

      {/* 批量更新结果 */}
      {batchResult && (
        <BatchResultBanner
          results={batchResult}
          onClose={() => setBatchResult(null)}
        />
      )}

      {/* 持仓表格 */}
      {isLoading ? (
        <GlassCard interactive={false} className="py-12 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </GlassCard>
      ) : holdings.length === 0 ? (
        <GlassCard interactive={false} className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            暂无持仓，点击右上角「新建持仓」开始添加
          </p>
        </GlassCard>
      ) : (
        <HoldingsTable
          holdings={holdings}
          updatingCode={updatingCode}
          onRefresh={(id) => updateOneMutation.mutate(id)}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* 表单弹层 */}
      {showForm && (
        <HoldingFormModal
          title={editing ? "编辑持仓" : "新建持仓"}
          initial={editing ?? undefined}
          saving={saveMutation.isPending}
          error={saveMutation.error as APIError | null}
          onSubmit={(body) => saveMutation.mutate(body)}
          onClose={closeForm}
        />
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="删除持仓"
        message={`确定要删除「${deleteTarget?.name ?? deleteTarget?.code}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}

// ============================================================
// 总盈亏统计卡片
// ============================================================
function SummaryGrid({ summary }: { summary?: FundSummary }) {
  const s = summary ?? {
    total_buy: 0,
    total_value: 0,
    total_profit: 0,
    total_rate: 0,
    holding_count: 0,
    updated_count: 0,
  };
  const profitPositive = s.total_profit >= 0;

  const cards = [
    {
      label: "总投入",
      value: formatMoney(s.total_buy),
      sub: `${s.holding_count} 只基金`,
      icon: <Wallet size={18} />,
      color: "var(--text-secondary)",
    },
    {
      label: "当前市值",
      value: formatMoney(s.total_value),
      sub: `${s.updated_count}/${s.holding_count} 已更新`,
      icon: <Coins size={18} />,
      color: "var(--accent-primary)",
    },
    {
      label: "总盈亏",
      value: (profitPositive ? "+" : "") + formatMoney(s.total_profit),
      sub: profitPositive ? "盈利中" : "亏损中",
      icon: profitPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      color: profitPositive ? "#dc2626" : "#16a34a", // 红涨绿跌
    },
    {
      label: "总收益率",
      value: (profitPositive ? "+" : "") + (s.total_rate * 100).toFixed(2) + "%",
      sub: profitPositive ? "盈利" : "亏损",
      icon: profitPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      color: profitPositive ? "#dc2626" : "#16a34a",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <GlassCard key={c.label} interactive={false} className="!p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {c.label}
            </span>
            <span style={{ color: c.color }}>{c.icon}</span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {c.value}
          </div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {c.sub}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ============================================================
// 持仓表格
// ============================================================
interface HoldingsTableProps {
  holdings: FundHolding[];
  updatingCode: string | null;
  onRefresh: (id: string) => void;
  onEdit: (item: FundHolding) => void;
  onDelete: (item: FundHolding) => void;
}

function HoldingsTable({ holdings, updatingCode, onRefresh, onEdit, onDelete }: HoldingsTableProps) {
  return (
    <GlassCard interactive={false} className="!p-0 overflow-hidden">
      {/* 表头（桌面） */}
      <div
        className="hidden lg:grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1.2fr_1.2fr_auto] gap-2 px-4 py-2.5 text-xs font-medium border-b"
        style={{
          color: "var(--text-muted)",
          borderColor: "var(--border-card)",
          background: "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
        }}
      >
        <span>基金</span>
        <span className="text-right">购买金额</span>
        <span className="text-right">购买净值</span>
        <span className="text-right">当前净值</span>
        <span className="text-right">份额</span>
        <span className="text-right">当前市值</span>
        <span className="text-right">盈亏</span>
        <span className="text-right">操作</span>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border-card)" }}>
        {holdings.map((h) => (
          <HoldingRow
            key={h.id}
            h={h}
            isUpdating={updatingCode === h.code}
            onRefresh={() => onRefresh(h.id)}
            onEdit={() => onEdit(h)}
            onDelete={() => onDelete(h)}
          />
        ))}
      </div>
    </GlassCard>
  );
}

function HoldingRow({
  h,
  isUpdating,
  onRefresh,
  onEdit,
  onDelete,
}: {
  h: FundHolding;
  isUpdating: boolean;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasNav = h.current_nav > 0 && h.shares > 0;
  const profitPositive = h.profit >= 0;
  const profitColor = !hasNav
    ? "var(--text-muted)"
    : profitPositive
    ? "#dc2626" // 红涨
    : "#16a34a"; // 绿跌

  return (
    <div
      className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1.2fr_1.2fr_auto] gap-2 px-4 py-3 text-sm items-center hover:bg-[color-mix(in_srgb,var(--accent-primary)_4%,transparent)] transition-colors"
    >
      {/* 基金信息 */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {h.name || h.code}
          </span>
          <code
            className="text-[10px] px-1.5 py-0.5 rounded tabular-nums"
            style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
          >
            {h.code}
          </code>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          买入 {h.buy_date}
          {h.last_updated && (
            <span className="ml-2">· 更新 {formatRelativeTime(h.last_updated)}</span>
          )}
        </div>
      </div>

      <NumberCell value={formatMoney(h.buy_amount)} />
      <NumberCell value={h.buy_nav.toFixed(4)} />
      <NumberCell
        value={hasNav ? h.current_nav.toFixed(4) : "—"}
        muted={!hasNav}
      />
      <NumberCell value={hasNav ? h.shares.toFixed(2) : "—"} muted={!hasNav} />

      {/* 当前市值 */}
      <div className="text-right tabular-nums" style={{ color: "var(--text-primary)" }}>
        {hasNav ? formatMoney(h.current_value) : "—"}
      </div>

      {/* 盈亏 */}
      <div className="text-right tabular-nums">
        {hasNav ? (
          <>
            <div style={{ color: profitColor }}>
              {profitPositive ? "+" : ""}{formatMoney(h.profit)}
            </div>
            <div className="text-[11px]" style={{ color: profitColor }}>
              {profitPositive ? "+" : ""}{(h.profit_rate * 100).toFixed(2)}%
            </div>
          </>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>—</span>
        )}
      </div>

      {/* 操作 */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onRefresh}
          disabled={isUpdating}
          className="btn-ghost !p-1.5"
          title="抓取最新净值"
          style={{ color: "var(--accent-primary)" }}
        >
          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </button>
        <button onClick={onEdit} className="btn-ghost !p-1.5" title="编辑">
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="btn-ghost !p-1.5"
          title="删除"
          style={{ color: "var(--status-error)" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function NumberCell({ value, muted = false }: { value: string; muted?: boolean }) {
  return (
    <div
      className="text-right tabular-nums hidden lg:block"
      style={{ color: muted ? "var(--text-muted)" : "var(--text-primary)" }}
    >
      {value}
    </div>
  );
}

// ============================================================
// 错误横幅
// ============================================================
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg p-3 text-sm flex items-center gap-2"
      style={{
        background: "color-mix(in srgb, var(--status-error) 12%, transparent)",
        color: "var(--status-error)",
      }}
    >
      <AlertCircle size={15} />
      {message}
    </div>
  );
}

// ============================================================
// 批量更新结果横幅
// ============================================================
function BatchResultBanner({
  results,
  onClose,
}: {
  results: FundNavUpdateResult[];
  onClose: () => void;
}) {
  const success = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return (
    <div
      className="rounded-lg p-3 text-sm"
      style={{
        background: failed.length
          ? "color-mix(in srgb, #f59e0b 10%, transparent)"
          : "color-mix(in srgb, #16a34a 10%, transparent)",
        border: `1px solid ${failed.length ? "#f59e0b40" : "#16a34a40"}`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: failed.length ? "#b45309" : "#15803d", fontWeight: 500 }}>
          批量更新完成：成功 {success.length} / 失败 {failed.length}
        </span>
        <button onClick={onClose} className="btn-ghost !p-1" title="关闭">
          <X size={14} />
        </button>
      </div>
      {failed.length > 0 && (
        <ul className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          {failed.map((r, i) => (
            <li key={i} className="font-mono">
              {r.code} {r.name && `(${r.name})`}：{r.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// 表单弹层
// ============================================================
interface FormModalProps {
  title: string;
  initial?: FundHolding;
  saving: boolean;
  error: APIError | null;
  onSubmit: (body: FundHoldingInput) => void;
  onClose: () => void;
}

function HoldingFormModal({ title, initial, saving, error, onSubmit, onClose }: FormModalProps) {
  const [form, setForm] = useState<FundHoldingInput>({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    buy_amount: initial?.buy_amount ?? 0,
    buy_nav: initial?.buy_nav ?? 0,
    buy_date: initial?.buy_date ?? new Date().toISOString().slice(0, 10),
    // 后端存小数（0.2=20%），表单显示用百分比（20）
    target_profit_rate: initial?.target_profit_rate ? initial.target_profit_rate * 100 : 0,
    stop_loss_rate: initial?.stop_loss_rate ? initial.stop_loss_rate * 100 : 0,
  });

  const fields: { name: keyof FundHoldingInput; label: string; type: "text" | "number" | "date"; placeholder: string; step?: string; suffix?: string }[] = [
    { name: "code", label: "基金代码", type: "text", placeholder: "000001" },
    { name: "name", label: "基金名称", type: "text", placeholder: "华夏成长（可留空，抓取后自动回填）" },
    { name: "buy_amount", label: "购买金额（元）", type: "number", placeholder: "10000", step: "100" },
    { name: "buy_nav", label: "购买净值", type: "number", placeholder: "1.5000", step: "0.0001" },
    { name: "buy_date", label: "购买日期", type: "date", placeholder: "" },
    { name: "target_profit_rate", label: "止盈率（%，0=不设置）", type: "number", placeholder: "20", step: "1", suffix: "%" },
    { name: "stop_loss_rate", label: "止损率（%，0=不设置）", type: "number", placeholder: "10", step: "1", suffix: "%" },
  ];

  const inputStyle = {
    width: "100%",
    background: "var(--bg-card)",
    border: "1px solid var(--border-card)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    outline: "none",
  } as const;

  function set(name: keyof FundHoldingInput, value: string | number) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  // 实时预览份额
  const previewShares =
    form.buy_amount > 0 && form.buy_nav > 0
      ? (form.buy_amount / form.buy_nav).toFixed(2)
      : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-lg !p-6"
        style={{ animation: "card-in 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            
            // 前端验证
            if (!form.code || form.code.trim().length !== 6) {
              alert("基金代码必须是6位（如：000001）");
              return;
            }
            if (!/^\d{6}$/.test(form.code.trim())) {
              alert("基金代码必须是6位数字");
              return;
            }
            if (form.buy_amount <= 0) {
              alert("购买金额必须大于0");
              return;
            }
            if (form.buy_nav <= 0) {
              alert("购买净值必须大于0");
              return;
            }
            if (!form.buy_date) {
              alert("购买日期不能为空");
              return;
            }
            
            // 把止盈/止损的百分比值转成小数（20 → 0.2，10 → 0.1）
            const payload: FundHoldingInput = {
              ...form,
              code: form.code.trim(),
              target_profit_rate: form.target_profit_rate ? form.target_profit_rate / 100 : 0,
              stop_loss_rate: form.stop_loss_rate ? form.stop_loss_rate / 100 : 0,
            };
            onSubmit(payload);
          }}
          className="space-y-3"
        >
          {fields.map((fd) => (
            <div key={fd.name}>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>
                {fd.label}
              </label>
              <div className="relative">
                <input
                  type={fd.type}
                  value={form[fd.name] as string | number}
                  placeholder={fd.placeholder}
                  step={fd.step}
                  onChange={(e) =>
                    set(
                      fd.name,
                      fd.type === "number"
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                  style={fd.suffix ? { ...inputStyle, paddingRight: 28 } : inputStyle}
                />
                {fd.suffix && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fd.suffix}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* 份额预览 */}
          <div
            className="rounded-lg px-3 py-2 text-xs flex items-center justify-between"
            style={{
              background: "color-mix(in srgb, var(--accent-primary) 8%, transparent)",
              color: "var(--text-secondary)",
            }}
          >
            <span>持有份额（自动计算）</span>
            <span className="tabular-nums font-medium" style={{ color: "var(--accent-primary)" }}>
              {previewShares}
            </span>
          </div>

          {error && (
            <div
              className="rounded-lg p-2 text-xs"
              style={{
                background: "color-mix(in srgb, var(--status-error) 12%, transparent)",
                color: "var(--status-error)",
              }}
            >
              {error.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ border: "1px solid var(--border-card)" }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent-gradient)" }}
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 格式化工具
// ============================================================
function formatMoney(n: number): string {
  // 两位小数，千分位逗号
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso);
  if (isNaN(t.getTime())) return iso;
  const diff = Date.now() - t.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return t.toLocaleDateString("zh-CN");
}
