import { Check, Loader2, Flame, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Habit } from "@/types/entities";

interface HabitCardProps {
  habit: Habit;
  onCheckIn: (todoId: string) => void;
  isPending?: boolean;
}

const FREQ_LABELS: Record<string, string> = {
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
};

export function HabitCard({ habit, onCheckIn, isPending }: HabitCardProps) {
  const freqLabel = FREQ_LABELS[habit.habit_frequency] || habit.habit_frequency;
  const targetStr = habit.habit_target > 0 ? `${habit.habit_target}次` : "";

  // 连胜里程碑动画
  const isMilestone = habit.streak > 0 && [7, 30, 50, 100, 365].includes(habit.streak);

  return (
    <GlassCard
      className="relative flex items-center gap-3 overflow-hidden"
      interactive={false}
    >
      {/* 左侧颜色条 */}
      <span
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{
          background: habit.today_checked
            ? "var(--status-ok)"
            : "var(--accent-secondary)",
        }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {habit.text}
          </span>
          {habit.habit_target > 0 && (
            <span
              className="flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-card)",
              }}
            >
              <Target size={10} />
              {freqLabel}{targetStr}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3">
          {/* 连胜 */}
          {habit.streak > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${isMilestone ? "animate-pulse" : ""}`}
              style={{ color: "#f97316" }}
            >
              <Flame size={14} />
              {habit.streak} 天
            </span>
          )}
        </div>
      </div>

      {/* 打卡按钮 */}
      <button
        onClick={() => onCheckIn(habit.id)}
        disabled={habit.today_checked || isPending}
        className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
          habit.today_checked
            ? "opacity-80"
            : "hover:scale-105 hover:shadow-lg active:scale-95"
        }`}
        style={{
          background: habit.today_checked
            ? "var(--status-ok)"
            : "var(--accent-gradient)",
          color: "#fff",
          cursor: habit.today_checked || isPending ? "default" : "pointer",
        }}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : habit.today_checked ? (
          <span className="flex items-center gap-1">
            <Check size={14} /> 已打卡
          </span>
        ) : (
          "打卡"
        )}
      </button>
    </GlassCard>
  );
}
