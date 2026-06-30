/**
 * formatRelativeTime — 把 ISO8601 时间转成「2h / 5h / 1d / 3d」相对时间
 *
 * 没用 Intl.RelativeTimeFormat 是因为它输出带单位文案（"2 hours ago"），
 * 这里需要紧凑的「2h」展示风格，一行能搞定的逻辑就不引依赖。
 */
export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo`;
  return `${Math.floor(month / 12)}y`;
}
