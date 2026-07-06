import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkle } from "@/components/ui/Sparkle";
import { GradientText } from "@/components/ui/GradientText";
import { NumberTicker } from "@/components/magicui/number-ticker";

function greeting(hour: number) {
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
}

/**
 * HeroCard — 首页 Hero 摘要卡片
 * 大号时间 + 问候 + 今日数据摘要
 *
 * 数据由父组件传入，组件本身不发起请求。
 * 每个 stat 数字可点击跳转（传 to）。
 */
export interface HeroStat {
  label: string;
  value: number;
  to?: string;
}

export function HeroCard({
  enterDelay = 0,
  stats = [],
}: {
  enterDelay?: number;
  stats?: HeroStat[];
}) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];

  return (
    <div
      className="glass-card card-in relative overflow-hidden p-7"
      style={{ animationDelay: `${enterDelay}ms` }}
    >
      <Sparkle count={6} />
      <div className="relative z-10">
        <div className="mb-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {month} 月 {day} 日 · 周{weekday}
        </div>
        <div className="flex items-baseline gap-3">
          <span
            className="font-mono text-6xl font-bold tracking-tight tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {hh}
            <span className="gradient-text">:</span>
            {mm}
          </span>
        </div>
        <p className="mt-3 text-xl">
          {greeting(now.getHours())}，<GradientText>Breeze</GradientText>
        </p>

        {stats.length > 0 && (
          <div className="mt-5 flex gap-6">
            {stats.map((s) => {
              const clickable = !!s.to;
              return (
                <div key={s.label}>
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && navigate(s.to!)}
                    className="group block text-left transition disabled:cursor-default"
                    title={clickable ? `查看${s.label}` : undefined}
                  >
                    <div
                      className="count-rise text-2xl font-semibold tabular-nums transition"
                      style={{
                        color: clickable
                          ? "var(--text-primary)"
                          : "var(--text-primary)",
                      }}
                    >
                      <span className="transition group-hover:text-[var(--accent-primary)] group-disabled:group-hover:text-[var(--text-primary)]">
                        <NumberTicker value={s.value} delay={0.6} />
                      </span>
                    </div>
                    <div
                      className="text-xs transition group-hover:text-[var(--accent-primary)] group-disabled:group-hover:text-[var(--text-muted)]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s.label}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
