/**
 * 番茄钟 API
 */
export const pomodoroAPI = {
  async getToday(): Promise<{ count: number }> {
    const res = await fetch("/api/v1/pomodoro/today");
    if (!res.ok) throw new Error("获取番茄统计失败");
    const body = await res.json();
    return body.data;
  },

  async increment(): Promise<{ count: number }> {
    const res = await fetch("/api/v1/pomodoro/increment", { method: "POST" });
    if (!res.ok) throw new Error("更新番茄统计失败");
    const body = await res.json();
    return body.data;
  },
};
