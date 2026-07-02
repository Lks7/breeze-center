import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Loader2,
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  LineChart as LineChartIcon,
  BarChart3,
  Percent,
  Activity,
  Bell,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { fundAPI } from "@/api/admin";
import type { FundHolding, FundSummary } from "@/types/entities";
import {
  InvestmentLineChart,
  ProfitBarChart,
  RateBarChart,
  NavTrendChart,
  CumulativeProfitChart,
} from "@/components/fund/FundCharts";

/**
 * FundPage — 基金详情页 /fund
 *
 * 面向"查看"的公开页面（区别于 /admin/fund 的 CRUD 管理页）：
 *   - 顶部：4 张总盈亏统计卡片
 *   - 中部：3 张纯 SVG 统计图（投入vs市值折线图 / 盈亏柱状图 / 收益率条形图）
 *   - 底部：所有持仓的精简表格
 *   - 右上角：去管理按钮（跳转 /admin/fund）
 *
 * 红涨绿跌（中文市场约定）
 */
export function FundPage() {
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["fund", "holdings"],
    queryFn: fundAPI.listHoldings,
  });
  const { data: summary } = useQuery({
    queryKey: ["fund", "summary"],
    queryFn: fundAPI.getSummary,
  });
  const { data: allHistory = [] } = useQuery({
    queryKey: ["fund", "history", "all"],
    queryFn: () => fundAPI.getAllHistory(1000),
    staleTime: 60 * 1000,
  });

  const validCount = holdings.filter((h) => h.current_nav > 0 && h.shares > 0).length;

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-6 py-6 space-y-5">
        {/* 顶部导航 */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="btn-ghost"
            style={{ border: "1px solid var(--border-card)" }}
          >
            <ArrowLeft size={15} />
            首页
          </Link>
          <h1 className="text-2xl font-semibold">
            <GradientText>基金盈亏</GradientText>
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/admin/fund"
              className="btn-ghost inline-flex items-center gap-1.5"
              style={{ border: "1px solid var(--border-card)" }}
              title="管理持仓"
            >
              <Settings size={14} />
              管理
            </Link>
          </div>
        </div>

        {/* 1. 总盈亏统计卡片 */}
        <SummaryGrid summary={summary} count={holdings.length} validCount={validCount} />

        {/* 2. 统计图表 */}
        {isLoading ? (
          <GlassCard interactive={false} className="py-16 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={16} className="animate-spin" />
            加载中...
          </GlassCard>
        ) : holdings.length === 0 ? (
          <GlassCard interactive={false} className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              暂无持仓数据
            </p>
            <Link
              to="/admin/fund"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: "var(--accent-gradient)" }}
            >
              <Settings size={14} />
              去添加持仓
            </Link>
          </GlassCard>
        ) : (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 折线图：投入 vs 市值 */}
            <GlassCard interactive={false} className="!p-5">
              <div className="mb-3 flex items-center justify-between">
                <ChartHeader icon={<LineChartIcon size={15} />} title="投入 vs 市值" />
                <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5" style={{ background: "var(--text-muted)", borderTop: "1px dashed var(--text-muted)" }} />
                    投入
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5" style={{ background: "var(--accent-primary)" }} />
                    市值
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center pt-1">
                <InvestmentLineChart holdings={holdings} />
              </div>
            </GlassCard>

            {/* 累计收益曲线 */}
            <GlassCard interactive={false} className="!p-5">
              <ChartHeader icon={<Activity size={15} />} title="累计收益曲线" />
              <div className="flex items-center justify-center pt-1">
                <CumulativeProfitChart history={allHistory} holdings={holdings} />
              </div>
            </GlassCard>

            {/* 柱状图：盈亏对比 */}
            <GlassCard interactive={false} className="!p-5">
              <ChartHeader icon={<BarChart3 size={15} />} title="盈亏对比" />
              <div className="flex items-center justify-center pt-2">
                <ProfitBarChart holdings={holdings} />
              </div>
            </GlassCard>

            {/* 条形图：收益率对比 */}
            <GlassCard interactive={false} className="!p-5">
              <ChartHeader icon={<Percent size={15} />} title="收益率对比" />
              <div className="flex items-center justify-center pt-2">
                <RateBarChart holdings={holdings} />
              </div>
            </GlassCard>
          </div>

          {/* 预警设置总览 */}
          {holdings.some((h) => h.target_profit_rate > 0 || h.stop_loss_rate > 0) && (
            <GlassCard interactive={false} className="!p-5">
              <ChartHeader icon={<Bell size={15} />} title="止盈止损预警" />
              <div className="flex flex-wrap gap-2">
                {holdings
                  .filter((h) => h.target_profit_rate > 0 || h.stop_loss_rate > 0)
                  .map((h) => (
                    <div
                      key={h.id}
                      className="rounded-lg px-3 py-2 text-xs flex items-center gap-2"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <span style={{ color: "var(--text-primary)" }}>{h.name || h.code}</span>
                      {h.target_profit_rate > 0 && (
                        <span style={{ color: "#dc2626" }}>
                          止盈 {(h.target_profit_rate * 100).toFixed(0)}%
                        </span>
                      )}
                      {h.stop_loss_rate > 0 && (
                        <span style={{ color: "#16a34a" }}>
                          止损 {(h.stop_loss_rate * 100).toFixed(0)}%
                        </span>
                      )}
                      {h.alert_triggered && (
                        <span style={{ color: "var(--text-muted)" }}>（已触发）</span>
                      )}
                    </div>
                  ))}
              </div>
            </GlassCard>
          )}
          </>
        )}

        {/* 3. 持仓列表 */}
        {!isLoading && holdings.length > 0 && (
          <HoldingsList holdings={holdings} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// 总盈亏统计卡片
// ============================================================
function SummaryGrid({
  summary,
  count,
  validCount,
}: {
  summary?: FundSummary;
  count: number;
  validCount: number;
}) {
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
      sub: `${count} 只基金`,
      icon: <Wallet size={18} />,
      color: "var(--text-secondary)",
    },
    {
      label: "当前市值",
      value: formatMoney(s.total_value),
      sub: `${validCount}/${count} 已更新`,
      icon: <Coins size={18} />,
      color: "var(--accent-primary)",
    },
    {
      label: "总盈亏",
      value: (profitPositive ? "+" : "") + formatMoney(s.total_profit),
      sub: profitPositive ? "盈利中" : "亏损中",
      icon: profitPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      color: profitPositive ? "#dc2626" : "#16a34a",
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
// 图表标题
// ============================================================
function ChartHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <span style={{ color: "var(--accent-primary)" }}>{icon}</span>
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
    </div>
  );
}

// ============================================================
// 持仓列表（精简版，可展开看净值走势）
// ============================================================
function HoldingsList({ holdings }: { holdings: FundHolding[] }) {
  const sorted = [...holdings].sort((a, b) => b.profit - a.profit);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <GlassCard interactive={false} className="!p-0 overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-card)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          持仓明细
        </h3>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          点击行展开净值走势 · 按盈亏降序
        </span>
      </div>

      {/* 表头（桌面） */}
      <div
        className="hidden lg:grid grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr_1.2fr] gap-2 px-5 py-2.5 text-xs font-medium border-b"
        style={{
          color: "var(--text-muted)",
          borderColor: "var(--border-card)",
          background: "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
        }}
      >
        <span>基金</span>
        <span className="text-right">购买金额</span>
        <span className="text-right">当前净值</span>
        <span className="text-right">市值</span>
        <span className="text-right">盈亏</span>
        <span className="text-right">收益率</span>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border-card)" }}>
        {sorted.map((h) => (
          <HoldingRow
            key={h.id}
            h={h}
            expanded={expandedId === h.id}
            onToggle={() => setExpandedId(expandedId === h.id ? null : h.id)}
          />
        ))}
      </div>
    </GlassCard>
  );
}

function HoldingRow({
  h,
  expanded,
  onToggle,
}: {
  h: FundHolding;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasNav = h.current_nav > 0 && h.shares > 0;
  const positive = h.profit >= 0;
  const color = !hasNav
    ? "var(--text-muted)"
    : positive
    ? "#dc2626"
    : "#16a34a";

  return (
    <div>
      <div
        className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr_1.2fr] gap-2 px-5 py-3 text-sm items-center transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_4%,transparent)] cursor-pointer"
        onClick={onToggle}
      >
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
            {(h.target_profit_rate > 0 || h.stop_loss_rate > 0) && (
              <Bell
                size={11}
                style={{ color: h.alert_triggered ? "#f59e0b" : "var(--accent-primary)" }}
              />
            )}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            买入 {h.buy_date} · 净值 {h.buy_nav.toFixed(4)}
          </div>
        </div>

        <div className="text-right tabular-nums hidden lg:block" style={{ color: "var(--text-primary)" }}>
          {formatMoney(h.buy_amount)}
        </div>
        <div className="text-right tabular-nums hidden lg:block" style={{ color: hasNav ? "var(--text-primary)" : "var(--text-muted)" }}>
          {hasNav ? h.current_nav.toFixed(4) : "—"}
        </div>
        <div className="text-right tabular-nums" style={{ color: "var(--text-primary)" }}>
          {hasNav ? formatMoney(h.current_value) : "—"}
        </div>
        <div className="text-right tabular-nums" style={{ color }}>
          {hasNav ? (positive ? "+" : "") + formatMoney(h.profit) : "—"}
        </div>
        <div className="text-right tabular-nums font-medium" style={{ color }}>
          {hasNav ? (positive ? "+" : "") + (h.profit_rate * 100).toFixed(2) + "%" : "—"}
        </div>
      </div>

      {/* 展开区域：净值走势 */}
      {expanded && (
        <div className="px-5 pb-4" style={{ background: "var(--bg-secondary)" }}>
          <NavTrendSection holdingId={h.id} buyNav={h.buy_nav} />
          {/* 预警设置 */}
          {(h.target_profit_rate > 0 || h.stop_loss_rate > 0) && (
            <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>预警设置：</span>
              {h.target_profit_rate > 0 && (
                <span style={{ color: "#dc2626" }}>止盈 {(h.target_profit_rate * 100).toFixed(0)}%</span>
              )}
              {h.stop_loss_rate > 0 && (
                <span style={{ color: "#16a34a" }}>止损 {(h.stop_loss_rate * 100).toFixed(0)}%</span>
              )}
              {h.alert_triggered && (
                <span style={{ color: "#f59e0b" }}>已触发</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 净值走势子组件（懒加载历史数据）
function NavTrendSection({ holdingId, buyNav }: { holdingId: string; buyNav: number }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["fund", "history", holdingId],
    queryFn: () => fundAPI.getHoldingHistory(holdingId, 365),
    staleTime: 60 * 1000,
  });

  return (
    <div className="pt-3">
      {isLoading ? (
        <div className="py-8 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={12} className="animate-spin" />
          加载历史数据...
        </div>
      ) : (
        <NavTrendChart history={history} buyNav={buyNav} />
      )}
    </div>
  );
}

// ============================================================
// 格式化工具
// ============================================================
function formatMoney(n: number): string {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
