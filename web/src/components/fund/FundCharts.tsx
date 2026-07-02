import { useState } from "react";
import type { FundHolding, FundNavHistory, FundHistoryItem } from "@/types/entities";

/**
 * 基金统计图组件 — 纯 SVG 手写，零第三方依赖
 *
 * 包含图表：
 *   1. InvestmentLineChart — 投入 vs 市值折线对比图
 *   2. ProfitBarChart      — 各基金盈亏对比柱状图（红涨绿跌）
 *   3. RateBarChart        — 各基金收益率对比横向条形图
 *   4. NavTrendChart       — 单只基金净值历史走势折线图
 *   5. CumulativeProfitChart — 整体累计收益曲线
 *
 * 颜色约定（中文市场）：盈利红色 #dc2626，亏损绿色 #16a34a
 */

// ============================================================
// 1. 投入 vs 市值折线对比图
// ============================================================

export function InvestmentLineChart({ holdings }: { holdings: FundHolding[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const valid = holdings.filter((h) => h.current_nav > 0 && h.shares > 0);
  if (valid.length === 0) return <EmptyChart message="暂无有效持仓数据" />;

  // 按购买日期排序，x 轴体现时间线
  const sorted = [...valid].sort((a, b) => a.buy_date.localeCompare(b.buy_date));

  const W = 360, H = 220;
  const padLeft = 44, padRight = 16, padTop = 16, padBottom = 42;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  // y 轴范围：取所有 buy_amount / current_value 的最大值，向上取整留余量
  const allValues = sorted.flatMap((h) => [h.buy_amount, h.current_value]);
  const maxVal = Math.max(...allValues, 1);
  // 取一个"漂亮"的上限（向上取到 5000 / 10000 / 50000 的整数倍）
  const yMax = niceCeil(maxVal);
  const yMin = 0;

  // x 轴点坐标
  const n = sorted.length;
  const xStep = n > 1 ? chartW / (n - 1) : 0;
  const xOf = (i: number) => padLeft + (n > 1 ? i * xStep : chartW / 2);
  const yOf = (v: number) => padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  // 两条折线的 path
  const buyPath = sorted.map((h, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(h.buy_amount)}`).join(" ");
  const valuePath = sorted.map((h, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(h.current_value)}`).join(" ");

  // y 轴刻度（4 档）
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));

  const hovered = hoverIdx !== null ? sorted[hoverIdx] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 520 }}>
      {/* y 轴网格线 + 刻度 */}
      {yTicks.map((v, i) => {
        const y = yOf(v);
        return (
          <g key={i}>
            <line
              x1={padLeft} y1={y}
              x2={W - padRight} y2={y}
              stroke="var(--border-card)" strokeWidth={0.5}
              opacity={i === 0 ? 1 : 0.5}
            />
            <text
              x={padLeft - 6} y={y + 3}
              textAnchor="end"
              style={{ fontSize: 8, fill: "var(--text-muted)" }}
            >
              {formatShort(v)}
            </text>
          </g>
        );
      })}

      {/* 投入金额折线（灰色虚线） */}
      <path
        d={buyPath}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={hoverIdx === null ? 0.8 : 0.4}
      />
      {/* 当前市值折线（渐变实线，用单色近似） */}
      <path
        d={valuePath}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth={2}
        opacity={hoverIdx === null ? 1 : 0.4}
      />

      {/* 数据点 */}
      {sorted.map((h, i) => {
        const x = xOf(i);
        const positive = h.current_value >= h.buy_amount;
        const pointColor = positive ? "#dc2626" : "#16a34a";
        const isHover = hoverIdx === i;
        return (
          <g key={h.id}>
            {/* 投入点（空心） */}
            <circle
              cx={x} cy={yOf(h.buy_amount)}
              r={isHover ? 4 : 3}
              fill="var(--bg-card)"
              stroke="var(--text-muted)"
              strokeWidth={1.5}
              opacity={hoverIdx === null || isHover ? 1 : 0.4}
            />
            {/* 市值点（实心，红/绿） */}
            <circle
              cx={x} cy={yOf(h.current_value)}
              r={isHover ? 5 : 3.5}
              fill={pointColor}
              stroke="var(--bg-card)"
              strokeWidth={1}
              opacity={hoverIdx === null || isHover ? 1 : 0.4}
            >
              <title>{`${h.name || h.code}\n投入: ${formatMoney(h.buy_amount)}\n市值: ${formatMoney(h.current_value)}\n盈亏: ${positive ? "+" : ""}${formatMoney(h.current_value - h.buy_amount)}`}</title>
            </circle>
            {/* x 轴基金名称 */}
            <text
              x={x} y={H - padBottom + 14}
              textAnchor="middle"
              style={{ fontSize: 9, fill: isHover ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: isHover ? 600 : 400 }}
            >
              {(h.name || h.code).slice(0, 5)}
            </text>
            <text
              x={x} y={H - padBottom + 24}
              textAnchor="middle"
              style={{ fontSize: 8, fill: "var(--text-muted)" }}
            >
              {h.code}
            </text>
            {/* hover 竖线 */}
            {isHover && (
              <line
                x1={x} y1={padTop}
                x2={x} y2={padTop + chartH}
                stroke="var(--accent-primary)"
                strokeWidth={0.5}
                strokeDasharray="2 2"
                opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {/* hover 详情浮层 */}
      {hovered && (
        <g>
          <rect
            x={padLeft + 4} y={padTop + 2}
            width={120} height={42}
            rx={4}
            fill="var(--bg-card)"
            stroke="var(--border-card)"
            strokeWidth={0.5}
            opacity={0.95}
          />
          <text x={padLeft + 10} y={padTop + 14} style={{ fontSize: 9, fill: "var(--text-secondary)", fontWeight: 600 }}>
            {(hovered.name || hovered.code).slice(0, 10)}
          </text>
          <text x={padLeft + 10} y={padTop + 25} style={{ fontSize: 9, fill: "var(--text-muted)" }}>
            投入 {formatMoney(hovered.buy_amount)}
          </text>
          <text x={padLeft + 10} y={padTop + 36} style={{ fontSize: 9, fill: hovered.current_value >= hovered.buy_amount ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
            市值 {formatMoney(hovered.current_value)}
          </text>
        </g>
      )}

      {/* 交互捕获层 */}
      {sorted.map((_, i) => {
        const x = xOf(i);
        const halfStep = n > 1 ? xStep / 2 : 20;
        return (
          <rect
            key={`capture-${i}`}
            x={x - halfStep} y={padTop}
            width={halfStep * 2} height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ cursor: "pointer" }}
          />
        );
      })}
    </svg>
  );
}

// ============================================================
// 2. 盈亏对比柱状图
// ============================================================

export function ProfitBarChart({ holdings }: { holdings: FundHolding[] }) {
  const valid = holdings.filter((h) => h.current_nav > 0 && h.shares > 0);
  if (valid.length === 0) return <EmptyChart message="暂无盈亏数据" />;

  const sorted = [...valid].sort((a, b) => b.profit - a.profit);
  const maxAbs = Math.max(...sorted.map((h) => Math.abs(h.profit)), 1);

  const W = 380, H = 240;
  const padLeft = 12, padRight = 12, padTop = 16, padBottom = 48;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;
  const zeroY = padTop + chartH / 2;
  const barW = Math.min(28, chartW / sorted.length - 6);
  const gap = (chartW - barW * sorted.length) / (sorted.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 480 }}>
      {/* 零线 */}
      <line
        x1={padLeft} y1={zeroY}
        x2={W - padRight} y2={zeroY}
        stroke="var(--border-card)" strokeWidth={1} strokeDasharray="2 2"
      />
      <text x={padLeft} y={zeroY - 4} style={{ fontSize: 9, fill: "var(--text-muted)" }}>0</text>

      {sorted.map((h, i) => {
        const positive = h.profit >= 0;
        const color = positive ? "#dc2626" : "#16a34a";
        const barH = (Math.abs(h.profit) / maxAbs) * (chartH / 2 - 6);
        const x = padLeft + gap + i * (barW + gap);
        const y = positive ? zeroY - barH : zeroY;
        const labelX = x + barW / 2;

        return (
          <g key={h.id}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              fill={color}
              rx={2}
              opacity={0.85}
            >
              <title>{`${h.name || h.code}: ${positive ? "+" : ""}${formatMoney(h.profit)}`}</title>
            </rect>
            {/* 柱顶数值 */}
            <text
              x={labelX}
              y={positive ? y - 4 : y + barH + 10}
              textAnchor="middle"
              style={{ fontSize: 9, fill: color, fontWeight: 600 }}
            >
              {positive ? "+" : ""}{formatShort(h.profit)}
            </text>
            {/* 基金名称 — 旋转45度避免重叠 */}
            <text
              x={labelX}
              y={H - padBottom + 14}
              textAnchor="end"
              transform={`rotate(-35, ${labelX}, ${H - padBottom + 14})`}
              style={{ fontSize: 9, fill: "var(--text-secondary)" }}
            >
              {(h.name || h.code).slice(0, 8)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// 3. 收益率对比横向条形图
// ============================================================

export function RateBarChart({ holdings }: { holdings: FundHolding[] }) {
  const valid = holdings.filter((h) => h.current_nav > 0 && h.shares > 0);
  if (valid.length === 0) return <EmptyChart message="暂无收益率数据" />;

  const sorted = [...valid].sort((a, b) => b.profit_rate - a.profit_rate);
  const maxAbs = Math.max(...sorted.map((h) => Math.abs(h.profit_rate)), 0.01);

  const rowH = 28;
  const labelW = 100;
  const valueW = 64;
  const W = 400;
  const chartW = W - labelW - valueW;
  const H = sorted.length * rowH + 8;
  const midX = labelW + chartW / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 480 }}>
      {/* 中线（0%） */}
      <line
        x1={midX} y1={4}
        x2={midX} y2={H - 4}
        stroke="var(--border-card)" strokeWidth={1} strokeDasharray="2 2"
      />
      <text x={midX} y={H - 1} textAnchor="middle" style={{ fontSize: 8, fill: "var(--text-muted)" }}>0%</text>

      {sorted.map((h, i) => {
        const positive = h.profit_rate >= 0;
        const color = positive ? "#dc2626" : "#16a34a";
        const barW = (Math.abs(h.profit_rate) / maxAbs) * (chartW / 2 - 4);
        const y = i * rowH + 6;
        const barH = 14;

        let barX: number;
        if (positive) {
          barX = midX;
        } else {
          barX = midX - barW;
        }

        return (
          <g key={h.id}>
            {/* 基金名称 */}
            <text
              x={labelW - 6}
              y={y + barH / 2 + 4}
              textAnchor="end"
              style={{ fontSize: 10, fill: "var(--text-secondary)" }}
            >
              {(h.name || h.code).slice(0, 8)}
            </text>
            {/* 条形 */}
            <rect
              x={barX} y={y}
              width={barW} height={barH}
              fill={color}
              rx={2}
              opacity={0.85}
            >
              <title>{`${h.name || h.code}: ${(h.profit_rate * 100).toFixed(2)}%`}</title>
            </rect>
            {/* 收益率数值 */}
            <text
              x={positive ? midX + barW + 4 : midX - barW - 4}
              y={y + barH / 2 + 4}
              textAnchor={positive ? "start" : "end"}
              style={{ fontSize: 10, fill: color, fontWeight: 600 }}
            >
              {positive ? "+" : ""}{(h.profit_rate * 100).toFixed(2)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// 4. 单只基金净值历史走势折线图
// ============================================================

export function NavTrendChart({
  history,
  buyNav,
}: {
  history: FundNavHistory[];
  buyNav: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (history.length === 0) {
    return <EmptyChart message="暂无净值历史数据（抓取后自动积累）" />;
  }

  const W = 380, H = 200;
  const padLeft = 40, padRight = 16, padTop = 16, padBottom = 36;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const navs = history.map((h) => h.nav);
  const allVals = buyNav > 0 ? [...navs, buyNav] : navs;
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;
  // 上下留 10% 余量
  const yMin = minVal - range * 0.1;
  const yMax = maxVal + range * 0.1;

  const n = history.length;
  const xOf = (i: number) => padLeft + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
  const yOf = (v: number) => padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const linePath = history.map((h, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(h.nav)}`).join(" ");
  const areaPath = linePath + ` L ${xOf(n - 1)} ${padTop + chartH} L ${xOf(0)} ${padTop + chartH} Z`;

  const buyNavY = buyNav > 0 ? yOf(buyNav) : null;
  const hovered = hoverIdx !== null ? history[hoverIdx] : null;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 560 }}>
      <defs>
        <linearGradient id="navArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.25} />
          <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* y 轴网格 */}
      {yTicks.map((v, i) => {
        const y = yOf(v);
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke="var(--border-card)" strokeWidth={0.5} opacity={0.5} />
            <text x={padLeft - 6} y={y + 3} textAnchor="end" style={{ fontSize: 8, fill: "var(--text-muted)" }}>
              {v.toFixed(4)}
            </text>
          </g>
        );
      })}

      {/* 买入净值参考线 */}
      {buyNavY !== null && (
        <>
          <line x1={padLeft} y1={buyNavY} x2={W - padRight} y2={buyNavY} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          <text x={W - padRight} y={buyNavY - 3} textAnchor="end" style={{ fontSize: 8, fill: "var(--text-muted)" }}>
            买入 {buyNav.toFixed(4)}
          </text>
        </>
      )}

      {/* 填充区域 */}
      <path d={areaPath} fill="url(#navArea)" />

      {/* 折线 */}
      <path d={linePath} fill="none" stroke="var(--accent-primary)" strokeWidth={2} />

      {/* 数据点 */}
      {history.map((h, i) => {
        const isHover = hoverIdx === i;
        const positive = h.nav >= buyNav;
        const color = buyNav > 0 ? (positive ? "#dc2626" : "#16a34a") : "var(--accent-primary)";
        return (
          <circle
            key={i}
            cx={xOf(i)} cy={yOf(h.nav)}
            r={isHover ? 4 : 2}
            fill={color}
            opacity={hoverIdx === null || isHover ? 1 : 0.4}
          >
            <title>{`${h.recorded_at.slice(0, 10)}: ${h.nav.toFixed(4)}`}</title>
          </circle>
        );
      })}

      {/* hover 竖线 + 数值 */}
      {hovered && hoverIdx !== null && (
        <>
          <line x1={xOf(hoverIdx)} y1={padTop} x2={xOf(hoverIdx)} y2={padTop + chartH} stroke="var(--accent-primary)" strokeWidth={0.5} strokeDasharray="2 2" opacity={0.5} />
          <g>
            <rect x={Math.min(xOf(hoverIdx) + 6, W - padRight - 90)} y={padTop + 4} width={84} height={28} rx={3} fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth={0.5} opacity={0.95} />
            <text x={Math.min(xOf(hoverIdx) + 10, W - padRight - 80)} y={padTop + 15} style={{ fontSize: 8, fill: "var(--text-muted)" }}>
              {hovered.recorded_at.slice(0, 10)}
            </text>
            <text x={Math.min(xOf(hoverIdx) + 10, W - padRight - 80)} y={padTop + 26} style={{ fontSize: 10, fill: "var(--text-primary)", fontWeight: 600 }}>
              {hovered.nav.toFixed(4)}
            </text>
          </g>
        </>
      )}

      {/* x 轴日期标签（首/中/尾） */}
      {[0, Math.floor(n / 2), n - 1].map((idx) => (
        <text key={idx} x={xOf(idx)} y={H - padBottom + 14} textAnchor="middle" style={{ fontSize: 8, fill: "var(--text-muted)" }}>
          {history[idx].recorded_at.slice(5, 10)}
        </text>
      ))}

      {/* 交互捕获 */}
      {history.map((_, i) => {
        const x = xOf(i);
        const halfStep = n > 1 ? chartW / (n - 1) / 2 : 20;
        return (
          <rect key={`cap-${i}`} x={x - halfStep} y={padTop} width={halfStep * 2} height={chartH} fill="transparent" onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: "pointer" }} />
        );
      })}
    </svg>
  );
}

// ============================================================
// 5. 整体累计收益曲线
// ============================================================

export function CumulativeProfitChart({
  history,
  holdings,
}: {
  history: FundHistoryItem[];
  holdings: FundHolding[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (history.length === 0) {
    return <EmptyChart message="暂无历史数据（抓取后自动积累）" />;
  }

  // 按 recorded_at 分组，每个时间点计算所有持仓的总市值
  // 按时间聚合：同一时间点的净值快照合并
  const byTime = new Map<string, Map<string, number>>(); // time -> (holdingId -> nav)
  for (const h of history) {
    if (!byTime.has(h.recorded_at)) byTime.set(h.recorded_at, new Map());
    byTime.get(h.recorded_at)!.set(h.holding_id, h.nav);
  }

  // 排序时间点
  const times = Array.from(byTime.keys()).sort();
  const totalBuy = holdings.reduce((s, h) => s + h.buy_amount, 0);

  // 计算每个时间点的累计收益（用最新已知的净值 × 份额 汇总）
  // 某持仓在某时间点没有记录时，用前一个已知值
  const lastNav = new Map<string, number>(); // holdingId -> last known nav
  const points = times.map((t) => {
    const snapshot = byTime.get(t)!;
    for (const [hid, nav] of snapshot) {
      lastNav.set(hid, nav);
    }
    let totalValue = 0;
    for (const h of holdings) {
      const nav = lastNav.get(h.id) ?? h.current_nav;
      if (nav > 0 && h.shares > 0) {
        totalValue += h.shares * nav;
      }
    }
    return { time: t, value: totalValue, profit: totalValue - totalBuy };
  });

  const W = 400, H = 220;
  const padLeft = 48, padRight = 16, padTop = 16, padBottom = 36;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const profits = points.map((p) => p.profit);
  const maxProfit = Math.max(...profits, 0);
  const minProfit = Math.min(...profits, 0);
  const range = maxProfit - minProfit || 1;
  const yMax = maxProfit + range * 0.1;
  const yMin = minProfit - range * 0.1;

  const n = points.length;
  const xOf = (i: number) => padLeft + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
  const yOf = (v: number) => padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
  const zeroY = yOf(0);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(p.profit)}`).join(" ");

  // 填充区域：盈利时向上填充红色，亏损时向下填充绿色
  const areaPath = linePath + ` L ${xOf(n - 1)} ${zeroY} L ${xOf(0)} ${zeroY} Z`;
  const fillColor = points[points.length - 1].profit >= 0 ? "#dc2626" : "#16a34a";

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 600 }}>
      <defs>
        <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* 零线 */}
      <line x1={padLeft} y1={zeroY} x2={W - padRight} y2={zeroY} stroke="var(--border-card)" strokeWidth={1} strokeDasharray="3 2" />
      <text x={padLeft - 6} y={zeroY + 3} textAnchor="end" style={{ fontSize: 8, fill: "var(--text-muted)" }}>0</text>

      {/* y 轴标签 */}
      {[yMin, (yMin + yMax) / 2, yMax].map((v, i) => (
        <text key={i} x={padLeft - 6} y={yOf(v) + 3} textAnchor="end" style={{ fontSize: 8, fill: "var(--text-muted)" }}>
          {formatShort(v)}
        </text>
      ))}

      {/* 填充 */}
      <path d={areaPath} fill="url(#profitArea)" />

      {/* 折线 */}
      <path d={linePath} fill="none" stroke={fillColor} strokeWidth={2} />

      {/* 数据点 */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={xOf(i)} cy={yOf(p.profit)}
          r={hoverIdx === i ? 4 : 2}
          fill={p.profit >= 0 ? "#dc2626" : "#16a34a"}
          opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.4}
        >
          <title>{`${p.time.slice(0, 10)}: ${p.profit >= 0 ? "+" : ""}${formatMoney(p.profit)}`}</title>
        </circle>
      ))}

      {/* hover */}
      {hovered && hoverIdx !== null && (
        <>
          <line x1={xOf(hoverIdx)} y1={padTop} x2={xOf(hoverIdx)} y2={padTop + chartH} stroke={fillColor} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.5} />
          <g>
            <rect x={Math.min(xOf(hoverIdx) + 6, W - padRight - 100)} y={padTop + 4} width={94} height={28} rx={3} fill="var(--bg-card)" stroke="var(--border-card)" strokeWidth={0.5} opacity={0.95} />
            <text x={Math.min(xOf(hoverIdx) + 10, W - padRight - 90)} y={padTop + 15} style={{ fontSize: 8, fill: "var(--text-muted)" }}>
              {hovered.time.slice(0, 10)}
            </text>
            <text x={Math.min(xOf(hoverIdx) + 10, W - padRight - 90)} y={padTop + 26} style={{ fontSize: 10, fill: hovered.profit >= 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
              {hovered.profit >= 0 ? "+" : ""}{formatMoney(hovered.profit)}
            </text>
          </g>
        </>
      )}

      {/* x 轴日期 */}
      {[0, Math.floor(n / 2), n - 1].map((idx) => (
        <text key={idx} x={xOf(idx)} y={H - padBottom + 14} textAnchor="middle" style={{ fontSize: 8, fill: "var(--text-muted)" }}>
          {points[idx].time.slice(5, 10)}
        </text>
      ))}

      {/* 交互捕获 */}
      {points.map((_, i) => {
        const x = xOf(i);
        const halfStep = n > 1 ? chartW / (n - 1) / 2 : 20;
        return (
          <rect key={`cap-${i}`} x={x - halfStep} y={padTop} width={halfStep * 2} height={chartH} fill="transparent" onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: "pointer" }} />
        );
      })}
    </svg>
  );
}

// ============================================================
// 空状态
// ============================================================
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
      {message}
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

function formatShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 10000) return (n / 10000).toFixed(1) + "万";
  return n.toFixed(0);
}

// niceCeil 把数值向上取整到"漂亮"的刻度（5000 / 10000 / 50000 的整数倍）。
// 用于折线图 y 轴上限，避免刻度出现 32817 这种尴尬数字。
function niceCeil(v: number): number {
  if (v <= 0) return 1000;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const ratio = v / pow;
  let nice: number;
  if (ratio <= 1) nice = 1;
  else if (ratio <= 2) nice = 2;
  else if (ratio <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}
