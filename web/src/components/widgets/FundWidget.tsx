import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, PiggyBank, Loader2, Clock } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { fundAPI } from "@/api/admin";
import type { FundHolding, FundSummary } from "@/types/entities";

/**
 * FundWidget — 首页基金盈亏卡片
 *
 * 显示每只基金的当日盈亏（基于最新抓取的净值）：
 *   - 顶部一行：总盈亏金额 + 总收益率
 *   - 列表：每只基金的名称、盈亏金额、收益率
 *   - 红涨绿跌（中文市场约定）
 *
 * 点击标题跳转到 /fund 查看完整详情与统计图。
 */
export function FundWidget({ enterDelay = 0 }: { enterDelay?: number }) {
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["home", "fund", "holdings"],
    queryFn: fundAPI.listHoldings,
    staleTime: 60 * 1000,
  });
  const { data: summary } = useQuery({
    queryKey: ["home", "fund", "summary"],
    queryFn: fundAPI.getSummary,
    staleTime: 60 * 1000,
  });

  // 只展示已抓取过净值的基金，按盈亏绝对值倒序（最显眼的在前）
  const visible = holdings
    .filter((h) => h.current_nav > 0 && h.shares > 0)
    .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit))
    .slice(0, 5);

  const s: FundSummary = summary ?? {
    total_buy: 0,
    total_value: 0,
    total_profit: 0,
    total_rate: 0,
    holding_count: 0,
    updated_count: 0,
  };
  const profitPositive = s.total_profit >= 0;
  const profitColor = profitPositive ? "#dc2626" : "#16a34a";

  return (
    <WidgetCard
      title="基金盈亏"
      icon={<PiggyBank size={16} />}
      enterDelay={enterDelay}
      to="/fund"
    >
      {/* 顶部总览 */}
      <div
        className="mb-3 rounded-lg px-3 py-2"
        style={{
          background: "color-mix(in srgb, var(--accent-primary) 6%, transparent)",
        }}
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              总盈亏
            </div>
            <div
              className="font-mono text-lg font-bold tabular-nums"
              style={{ color: s.total_profit === 0 ? "var(--text-primary)" : profitColor }}
            >
              {s.total_profit > 0 ? "+" : ""}
              {formatMoney(s.total_profit)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              收益率
            </div>
            <div
              className="font-mono text-sm font-semibold tabular-nums"
              style={{ color: s.total_rate === 0 ? "var(--text-primary)" : profitColor }}
            >
              {s.total_rate > 0 ? "+" : ""}
              {(s.total_rate * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* 每只基金的盈亏列表 */}
      {isLoading ? (
        <div className="py-4 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={12} className="animate-spin" />
          加载中...
        </div>
      ) : visible.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          暂无基金盈亏数据
          <br />
          <span className="text-[10px]">请先在后台添加持仓并抓取净值</span>
        </p>
      ) : (
        <ul className="space-y-1">
          {visible.map((h) => (
            <FundRow key={h.id} h={h} />
          ))}
        </ul>
      )}

      {/* 底部小字 */}
      {holdings.length > 0 && (
        <>
          <div className="mt-2 flex items-center justify-between gap-2" style={{ color: "var(--text-muted)" }}>
            {/* 更新时间 */}
            {(() => {
              const lastUpdated = holdings
                .filter((h) => h.last_updated)
                .map((h) => h.last_updated)
                .sort()
                .reverse()[0];
              if (!lastUpdated) return null;
              return (
                <span className="flex items-center gap-1 text-[10px]">
                  <Clock size={10} />
                  数据更新于 {formatTimeAgo(lastUpdated)}
                </span>
              );
            })()}
            <span className="text-[10px]">
              共 {s.holding_count} 只 · {s.updated_count} 只已更新
            </span>
          </div>
        </>
      )}
    </WidgetCard>
  );
}

function FundRow({ h }: { h: FundHolding }) {
  const positive = h.profit >= 0;
  const color = positive ? "#dc2626" : "#16a34a";
  return (
    <li
      className="flex items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-[color-mix(in_srgb,var(--accent-primary)_4%,transparent)]"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
          {h.name || h.code}
        </div>
        <div className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {h.code} · 市值 {formatMoney(h.current_value)}
        </div>
      </div>
      <div className="ml-2 flex items-center gap-1 text-right">
        {positive ? (
          <TrendingUp size={11} style={{ color }} />
        ) : (
          <TrendingDown size={11} style={{ color }} />
        )}
        <div>
          <div className="font-mono text-xs font-semibold tabular-nums" style={{ color }}>
            {positive ? "+" : ""}{formatMoney(h.profit)}
          </div>
          <div className="font-mono text-[10px] tabular-nums" style={{ color }}>
            {positive ? "+" : ""}{(h.profit_rate * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </li>
  );
}

function formatTimeAgo(t: string): string {
  if (!t) return "未知";
  const d = new Date(t);
  if (isNaN(d.getTime())) return t.slice(0, 10);
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const yesterday = new Date(now.getTime() - 86400000);
  const yStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
  if (dateStr === todayStr) return `今天 ${timeStr}`;
  if (dateStr === yStr) return `昨天 ${timeStr}`;
  return `${dateStr} ${timeStr}`;
}

function formatMoney(n: number): string {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
