import { useQuery } from "@tanstack/react-query";
import { subscriptionAPI } from "@/api/subscription";
import { Clock, AlertTriangle } from "lucide-react";

interface Props {
  enterDelay?: number;
}

function getDaysLeft(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export function SubscriptionWidget({ enterDelay = 0 }: Props) {
  const { data: subs } = useQuery({
    queryKey: ["subscriptions-expiring"],
    queryFn: () => subscriptionAPI.getExpiring(30),
    staleTime: 60000,
  });

  const list = subs?.slice(0, 3) ?? [];

  return (
    <div
      className="glass-card p-4 animate-fade-in"
      style={{ animationDelay: `${enterDelay}ms` }}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          订阅到期提醒
        </h3>
      </div>

      {list.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          暂无即将到期的订阅
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((sub) => {
            const days = getDaysLeft(sub.expire_date);
            const color = days <= 0 ? "#ef4444" : days <= 7 ? "#f97316" : "#eab308";
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {sub.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {sub.type}
                    {sub.provider ? ` · ${sub.provider}` : ""}
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-1 text-xs font-bold" style={{ color }}>
                  <Clock size={12} />
                  {days <= 0 ? "已过期" : `${days}天`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
