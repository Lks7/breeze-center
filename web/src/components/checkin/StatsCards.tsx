import { Flame, CalendarCheck, BarChart3, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface StatsCardsProps {
  currentStreak: number;
  longestStreak: number;
  weekDone: number;
  weekTarget: number;
  monthDone: number;
  monthTarget: number;
}

export function StatsCards({
  currentStreak,
  longestStreak,
  weekDone,
  weekTarget,
  monthDone,
  monthTarget,
}: StatsCardsProps) {
  const stats = [
    {
      label: "当前连胜",
      value: `${currentStreak}天`,
      icon: <Flame size={18} style={{ color: "#f97316" }} />,
      color: "#f97316",
    },
    {
      label: "历史最长",
      value: `${longestStreak}天`,
      icon: <Trophy size={18} style={{ color: "#fbbf24" }} />,
      color: "#fbbf24",
    },
    {
      label: "本周完成",
      value: `${weekDone}/${weekTarget > 0 ? weekTarget : "-"}`,
      icon: <CalendarCheck size={18} style={{ color: "var(--accent-primary)" }} />,
      color: "var(--accent-primary)",
    },
    {
      label: "本月完成",
      value: `${monthDone}/${monthTarget > 0 ? monthTarget : "-"}`,
      icon: <BarChart3 size={18} style={{ color: "var(--accent-secondary)" }} />,
      color: "var(--accent-secondary)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <GlassCard
          key={s.label}
          interactive={false}
          className="flex flex-col gap-1 !p-4"
        >
          <div className="flex items-center gap-1.5">
            {s.icon}
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {s.label}
            </span>
          </div>
          <span
            className="text-xl font-bold font-mono tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {s.value}
          </span>
        </GlassCard>
      ))}
    </div>
  );
}
