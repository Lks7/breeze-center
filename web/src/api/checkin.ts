/**
 * Check-in API — 习惯打卡
 */

import { api } from "./client";
import type { Habit, CheckIn, HabitStats } from "@/types/entities";

export const checkInAPI = {
  /** 获取所有习惯目标（含今日打卡状态 + 连胜） */
  listHabits: () => api.get<Habit[]>("/habits"),

  /** 创建打卡记录 */
  createCheckIn: (todoId: string, checkDate?: string) =>
    api.post<CheckIn>("/check-ins", { todo_id: todoId, check_date: checkDate }),

  /** 删除打卡记录 */
  deleteCheckIn: (id: string) =>
    api.del<{ status: string }>(`/check-ins/${id}`),

  /** 获取某习惯的某月打卡日期列表 */
  listCheckIns: (todoId: string, month: string) =>
    api.get<string[]>(`/check-ins?todo_id=${todoId}&month=${month}`),

  /** 获取某个习惯的统计数据 */
  getStats: (habitId: string) =>
    api.get<HabitStats>(`/habits/${habitId}/stats`),
};
