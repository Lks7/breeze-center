import { Bell, Rss, GitBranch, Activity, Timer, Info } from "lucide-react";

/** 通知类型 → 图标映射，供 Widget 和 Page 共用 */
export const notificationIconMap: Record<string, typeof Bell> = {
  rss: Rss,
  github: GitBranch,
  service: Activity,
  pomodoro: Timer,
  system: Info,
};

/** 格式化 ISO 时间为 MM-DD HH:mm */
export function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MM}-${DD} ${HH}:${mm}`;
}
