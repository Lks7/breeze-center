import { useQuery } from "@tanstack/react-query";
import { X, Flame, Target, Calendar, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { checkInAPI } from "@/api/checkin";
import type { Habit } from "@/types/entities";

interface HabitDetailPanelProps {
  habit: Habit;
  onClose: () => void;
}

const FREQ_LABELS: Record<string, string> = {
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
};

/**
 * HabitDetailPanel — 习惯详情弹窗
 *
 * 展示习惯的完整信息：基本信息、打卡记录列表、统计数据。
 */
export function HabitDetailPanel({ habit, onClose }: HabitDetailPanelProps) {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["habit", "stats", habit.id],
    queryFn: () => checkInAPI.getStats(habit.id),
  });

  const { data: dates = [], isLoading: datesLoading } = useQuery({
    queryKey: ["habit", "dates", habit.id],
    queryFn: async () => {
      // 获取最近 90 天的打卡日期
      const now = new Date();
      const result: string[] = [];
      // 获取近 3 个月
      for (let i = 0; i < 3; i++) {
        const y = now.getFullYear();
        const m = now.getMonth() + 1 - i;
        const year = m > 0 ? y : y - 1;
        const month = ((m + 11) % 12) + 1;
        const monthStr = `${year}-${String(month).padStart(2, "0")}`;
        try {
          const dates = await checkInAPI.listCheckIns(habit.id, monthStr);
          result.push(...dates);
        } catch {
          // ignore
        }
      }
      return result.sort((a, b) => b.localeCompare(a));
    },
  });

  const freqLabel = FREQ_LABELS[habit.habit_frequency] || habit.habit_frequency;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <GlassCard
        interactive={false}
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto !p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 transition hover:bg-[var(--bg-card-hover)]"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={16} />
        </button>

        {/* 标题 */}
        <h2 className="text-lg font-semibold pr-6" style={{ color: "var(--text-primary)" }}>
          {habit.text}
        </h2>

        {/* 基本信息 */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-card)",
            }}
          >
            <Target size={10} />
            {freqLabel}
            {habit.habit_target > 0 && `${habit.habit_target}次`}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            style={{
              background: "var(--bg-card)",
              color: "#f97316",
              border: "1px solid var(--border-card)",
            }}
          >
            <Flame size={10} />
            当前 {stats?.current_streak ?? 0} 天
          </span>
        </div>

        {/* 统计卡片 */}
        {statsLoading ? (
          <div className="mt-4 flex items-center gap-2 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={14} className="animate-spin" />
            加载统计...
          </div>
        ) : stats ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="总打卡" value={stats.total_check_ins} />
            <MiniStat label="当前连胜" value={`${stats.current_streak}天`} highlight="#f97316" />
            <MiniStat label="最长连胜" value={`${stats.longest_streak}天`} highlight="#fbbf24" />
            <MiniStat label="今日" value={stats.today_done ? "✅ 已完成" : "⬜ 未打卡"} />
          </div>
        ) : null}

        {/* 本周/本月进度 */}
        {stats && (
          <div className="mt-4 space-y-2">
            <WeekMonthBar
              label="本周"
              done={stats.week_done}
              target={stats.week_target}
            />
            <WeekMonthBar
              label="本月"
              done={stats.month_done}
              target={stats.month_target}
            />
          </div>
        )}

        {/* 打卡记录列表 */}
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              打卡记录（最近 90 天）
            </span>
          </h3>
          {datesLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={14} className="animate-spin" />
              加载记录...
            </div>
          ) : dates.length === 0 ? (
            <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              暂无打卡记录
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {dates.slice(0, 60).map((d) => {
                const [_, m, day] = d.split("-");
                return (
                  <span
                    key={d}
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-mono"
                    style={{
                      background: "var(--accent-primary)",
                      color: "#fff",
                      opacity: 0.85,
                    }}
                    title={d}
                  >
                    {m}/{day}
                  </span>
                );
              })}
              {dates.length > 60 && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  +{dates.length - 60} 条更多
                </span>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ============================================================
// 小统计项
// ============================================================

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: string;
}) {
  return (
    <div
      className="rounded-lg p-2.5 text-center"
      style={{ background: "var(--bg-card)" }}
    >
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="mt-0.5 font-semibold font-mono text-sm tabular-nums"
        style={{ color: highlight ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================
// 周/月进度条
// ============================================================

function WeekMonthBar({
  label,
  done,
  target,
}: {
  label: string;
  done: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : done > 0 ? 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full" style={{ background: "var(--bg-card)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "var(--accent-gradient)",
          }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
        {done}/{target > 0 ? target : "-"}
      </span>
    </div>
  );
}
