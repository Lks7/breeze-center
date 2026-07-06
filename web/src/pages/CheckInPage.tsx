import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Flame, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { HabitCard } from "@/components/checkin/HabitCard";
import { CalendarHeatmap } from "@/components/checkin/CalendarHeatmap";
import { StatsCards } from "@/components/checkin/StatsCards";
import { checkInAPI } from "@/api/checkin";
import type { HabitStats } from "@/types/entities";

export function CheckInPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // 加载习惯列表
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: checkInAPI.listHabits,
  });

  // 加载所有习惯的统计数据
  const { data: habitStatsMap } = useQuery({
    queryKey: ["habits", "stats", habits.map((h) => h.id).join(",")],
    queryFn: async () => {
      const map: Record<string, HabitStats> = {};
      await Promise.all(
        habits.map(async (h) => {
          try {
            map[h.id] = await checkInAPI.getStats(h.id);
          } catch {
            // 该习惯暂无统计数据
          }
        })
      );
      return map;
    },
    enabled: habits.length > 0,
  });

  // 加载当前月份所有习惯的打卡日期（用于热力图）
  const { data: calendarData = {} } = useQuery({
    queryKey: ["checkins", "calendar", calendarYear, calendarMonth],
    queryFn: async () => {
      const monthStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`;
      const allDates: Record<string, string[]> = {};
      await Promise.all(
        habits.map(async (h) => {
          try {
            allDates[h.id] = await checkInAPI.listCheckIns(h.id, monthStr);
          } catch {
            allDates[h.id] = [];
          }
        })
      );
      return allDates;
    },
    enabled: habits.length > 0,
  });

  // 选中某个习惯查看其日历
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const selectedDates = selectedHabitId ? calendarData[selectedHabitId] ?? [] : [];

  // 聚合统计
  const aggStats = useMemo(() => {
    if (!habitStatsMap) return null;
    const entries = Object.values(habitStatsMap);
    if (entries.length === 0) return null;
    return {
      currentStreak: Math.max(...entries.map((s) => s.current_streak), 0),
      longestStreak: Math.max(...entries.map((s) => s.longest_streak), 0),
      weekDone: entries.reduce((sum, s) => sum + s.week_done, 0),
      weekTarget: entries.reduce((sum, s) => sum + s.week_target, 0),
      monthDone: entries.reduce((sum, s) => sum + s.month_done, 0),
      monthTarget: entries.reduce((sum, s) => sum + s.month_target, 0),
      totalCheckIns: entries.reduce((sum, s) => sum + s.total_check_ins, 0),
    };
  }, [habitStatsMap]);

  // 打卡 mutation
  const checkInMut = useMutation({
    mutationFn: async (todoId: string) => {
      setCheckingId(todoId);
      return checkInAPI.createCheckIn(todoId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      qc.invalidateQueries({ queryKey: ["habits", "stats"] });
      qc.invalidateQueries({ queryKey: ["checkins"] });
    },
    onSettled: () => setCheckingId(null),
  });

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const uncheckedHabits = habits.filter((h) => !h.today_checked);
  const checkedHabits = habits.filter((h) => h.today_checked);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
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
          <GradientText>习惯打卡</GradientText>
        </h1>
        <span className="text-xs rounded-full px-2 py-0.5" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
          {todayStr}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : habits.length === 0 ? (
        <GlassCard interactive={false} className="py-16 text-center">
          <Sparkles size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            还没有习惯目标
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            前往{" "}
            <Link
              to="/plans"
              className="underline"
              style={{ color: "var(--accent-primary)" }}
            >
              计划管理
            </Link>{" "}
            页面，创建待办时勾选「设为习惯」即可开始
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* 今日打卡区 */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              <Flame size={14} style={{ color: "#f97316" }} />
              今日打卡
              {uncheckedHabits.length > 0 && (
                <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                  {uncheckedHabits.length} 项待打卡
                </span>
              )}
            </h2>
            <div className="space-y-2">
              {[...uncheckedHabits, ...checkedHabits].map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onCheckIn={(id) => checkInMut.mutate(id)}
                  isPending={checkingId === habit.id}
                />
              ))}
            </div>
          </section>

          {/* 日历热力图 */}
          <section>
            <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              打卡日历
            </h2>
            <GlassCard interactive={false}>
              {/* 习惯选择器 */}
              {habits.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedHabitId(null)}
                    className="rounded-lg px-2.5 py-1 text-xs transition"
                    style={{
                      background: !selectedHabitId ? "var(--accent-primary)" : "var(--bg-card)",
                      color: !selectedHabitId ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    全部
                  </button>
                  {habits.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHabitId(h.id)}
                      className="rounded-lg px-2.5 py-1 text-xs transition truncate max-w-[120px]"
                      style={{
                        background: selectedHabitId === h.id ? "var(--accent-primary)" : "var(--bg-card)",
                        color: selectedHabitId === h.id ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {h.text}
                    </button>
                  ))}
                </div>
              )}
              <CalendarHeatmap
                checkedDates={
                  selectedHabitId
                    ? selectedDates
                    : [...new Set(Object.values(calendarData).flat())]
                }
                year={calendarYear}
                month={calendarMonth}
                onMonthChange={(y, m) => {
                  setCalendarYear(y);
                  setCalendarMonth(m);
                }}
              />
            </GlassCard>
          </section>

          {/* 统计卡片 */}
          {aggStats && (
            <section>
              <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                数据统计
              </h2>
              <StatsCards {...aggStats} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
