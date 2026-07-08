import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Flame, Sparkles, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HabitCard } from "@/components/checkin/HabitCard";
import { CalendarHeatmap } from "@/components/checkin/CalendarHeatmap";
import { StatsCards } from "@/components/checkin/StatsCards";
import { checkInAPI } from "@/api/checkin";
import { todoAPI } from "@/api/admin";
import type { HabitStats } from "@/types/entities";

/**
 * HabitsPage - 习惯打卡快捷页
 *
 * 核心打卡功能已整合到 /plans（目标管理中心）。
 * 此页面保留为专注的打卡入口，方便快速操作。
 */
export function HabitsPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

  // 表单状态
  const [habitName, setHabitName] = useState("");
  const [habitFreq, setHabitFreq] = useState("daily");
  const [habitTarget, setHabitTarget] = useState(1);

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits", "checkin-page"],
    queryFn: checkInAPI.listHabits,
  });

  const { data: habitStatsMap } = useQuery({
    queryKey: ["habits", "stats", "checkin-page", habits.map((h) => h.id).join(",")],
    queryFn: async () => {
      const map: Record<string, HabitStats> = {};
      await Promise.all(
        habits.map(async (h) => {
          try {
            map[h.id] = await checkInAPI.getStats(h.id);
          } catch {
            // ignore
          }
        })
      );
      return map;
    },
    enabled: habits.length > 0,
  });

  const { data: calendarData = {} } = useQuery({
    queryKey: ["checkins", "calendar", calendarYear, calendarMonth, habits.map((h) => h.id).join(",")],
    queryFn: async () => {
      const ids = habits.map((h) => h.id);
      if (ids.length === 0) return {};
      return checkInAPI.batchListCheckIns(ids, `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`);
    },
    enabled: habits.length > 0,
  });

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // 从 calendarData 中提取成功和失败的日期
  const selectedDates = useMemo(() => {
    if (selectedHabitId) {
      return Object.entries(calendarData[selectedHabitId] ?? {})
        .filter(([_, status]) => status === "success")
        .map(([date]) => date);
    }
    // 全部习惯：聚合所有习惯的成功日期
    const dates = new Set<string>();
    Object.values(calendarData).forEach((habitData) => {
      Object.entries(habitData).forEach(([date, status]) => {
        if (status === "success") dates.add(date);
      });
    });
    return Array.from(dates);
  }, [selectedHabitId, calendarData]);

  const failedDates = useMemo(() => {
    if (selectedHabitId) {
      return Object.entries(calendarData[selectedHabitId] ?? {})
        .filter(([_, status]) => status === "failure")
        .map(([date]) => date);
    }
    // 全部习惯：聚合所有习惯的失败日期
    const dates = new Set<string>();
    Object.values(calendarData).forEach((habitData) => {
      Object.entries(habitData).forEach(([date, status]) => {
        if (status === "failure") dates.add(date);
      });
    });
    return Array.from(dates);
  }, [selectedHabitId, calendarData]);

  const aggStats = useMemo(() => {
    if (!habitStatsMap) return null;
    const entries = Object.values(habitStatsMap);
    if (entries.length === 0) return null;
    return {
      currentStreak: Math.max(...entries.map((s) => s.current_streak), 0),
      longestStreak: Math.max(...entries.map((s) => s.longest_streak), 0),
      weekDone: entries.reduce((sum, s) => sum + s.week_done, 0),
      weekTarget: Math.max(...entries.map((s) => s.week_target), 0),
      monthDone: entries.reduce((sum, s) => sum + s.month_done, 0),
      monthTarget: Math.max(...entries.map((s) => s.month_target), 0),
      totalCheckIns: entries.reduce((sum, s) => sum + s.total_check_ins, 0),
    };
  }, [habitStatsMap]);

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["habits"] });
    qc.invalidateQueries({ queryKey: ["habits", "stats"] });
    qc.invalidateQueries({ queryKey: ["checkins"] });
  }, [qc]);

  const checkInMut = useMutation({
    mutationFn: async (todoId: string) => {
      setCheckingId(todoId);
      return checkInAPI.createCheckIn(todoId);
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setCheckingId(null),
  });

  const checkInFailMut = useMutation({
    mutationFn: async (todoId: string) => {
      setCheckingId(todoId);
      return checkInAPI.createCheckIn(todoId, undefined, "failure");
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setCheckingId(null),
  });

  const checkInDateMut = useMutation({
    mutationFn: async ({ todoId, date }: { todoId: string; date: string }) => {
      setCheckingId(todoId);
      return checkInAPI.createCheckIn(todoId, date);
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setCheckingId(null),
  });

  const uncheckMut = useMutation({
    mutationFn: async ({ todoId, date }: { todoId: string; date: string }) => {
      setCheckingId(todoId);
      return checkInAPI.deleteCheckInByDate(todoId, date);
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setCheckingId(null),
  });

  // 创建习惯
  // 删除习惯
  const deleteHabitMut = useMutation({
    mutationFn: async (id: string) => {
      return todoAPI.delete(id);
    },
    onSuccess: () => {
      setDeleteHabitId(null);
      invalidateAll();
    },
  });

  const createHabitMut = useMutation({
    mutationFn: async () => {
      return todoAPI.create({
        text: habitName,
        is_habit: true,
        habit_frequency: habitFreq,
        habit_target: habitTarget,
        priority: "medium",
      });
    },
    onSuccess: () => {
      setHabitName("");
      setHabitFreq("daily");
      setHabitTarget(1);
      invalidateAll();
    },
  });

  const uncheckedHabits = habits.filter((h) => !h.today_checked);
  const checkedHabits = habits.filter((h) => h.today_checked);

  const handleDateClick = useCallback(
    (date: string) => {
      if (!selectedHabitId) return;
      const dateStatusMap = calendarData[selectedHabitId] ?? {};
      if (date in dateStatusMap) {
        uncheckMut.mutate({ todoId: selectedHabitId, date });
      } else {
        checkInDateMut.mutate({ todoId: selectedHabitId, date });
      }
    },
    [selectedHabitId, calendarData, checkInDateMut, uncheckMut]
  );

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    createHabitMut.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
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
            在下方创建你的第一个习惯吧
          </p>
        </GlassCard>
      ) : null}

      <div className="space-y-6">
        {/* 添加习惯表单 */}
        <GlassCard interactive={false}>
          <form onSubmit={handleCreateHabit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                习惯名称
              </label>
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder="例如：晨跑 30 分钟"
                className="w-full rounded-xl px-3 py-2 text-sm outline-none transition"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-card)",
                }}
              />
            </div>

            <div>
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                频率
              </label>
              <select
                value={habitFreq}
                onChange={(e) => setHabitFreq(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm outline-none transition"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-card)",
                }}
              >
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>

            <div>
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                目标次数
              </label>
              <input
                type="number"
                min={1}
                value={habitTarget}
                onChange={(e) => setHabitTarget(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 rounded-xl px-3 py-2 text-sm outline-none transition"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-card)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!habitName.trim() || createHabitMut.isPending}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
              style={{
                background: "var(--accent-gradient)",
                cursor: !habitName.trim() || createHabitMut.isPending ? "default" : "pointer",
              }}
            >
              {createHabitMut.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              添加习惯
            </button>
          </form>
        </GlassCard>

        {/* 今日打卡 */}
        {habits.length > 0 && (
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
                  onCheckInFail={(id) => checkInFailMut.mutate(id)}
                  onDelete={(id) => setDeleteHabitId(id)}
                  isPending={checkingId === habit.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* 日历 */}
        {habits.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              打卡日历
            </h2>
            <GlassCard interactive={false}>
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
                checkedDates={selectedDates}
                failedDates={failedDates}
                year={calendarYear}
                month={calendarMonth}
                onMonthChange={(y, m) => {
                  setCalendarYear(y);
                  setCalendarMonth(m);
                }}
                onDateClick={selectedHabitId ? handleDateClick : undefined}
              />
              {selectedHabitId && (
                <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  点击日期可补打卡/取消打卡
                </p>
              )}
            </GlassCard>
          </section>
        )}

        {/* 统计 */}
        {aggStats && (
          <section>
            <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              数据统计
            </h2>
            <StatsCards {...aggStats} />
          </section>
        )}
      </div>

      {/* 删除确认 */}
      <ConfirmDialog
        open={deleteHabitId !== null}
        title="删除习惯"
        message={`确定要删除「${habits.find((h) => h.id === deleteHabitId)?.text || ""}」吗？所有打卡记录将被一同删除。`}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={() => {
          if (deleteHabitId) deleteHabitMut.mutate(deleteHabitId);
        }}
        onCancel={() => setDeleteHabitId(null)}
      />
    </div>
  );
}
