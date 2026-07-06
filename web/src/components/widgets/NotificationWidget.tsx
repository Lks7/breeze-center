import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Info, ExternalLink } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationIconMap } from "@/utils/notifications";

interface Props {
  enterDelay?: number;
}

export function NotificationWidget({ enterDelay = 0 }: Props) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  const list = notifications.slice(0, 20);

  return (
    <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: `${enterDelay}ms` }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bell size={16} style={{ color: "var(--accent-primary)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>通知</h3>
          {unreadCount > 0 && (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={markAllRead} className="rounded p-1 transition-all hover:scale-110"
            style={{ color: "var(--text-muted)" }} title="全部已读">
            <CheckCheck size={14} />
          </button>
          <button onClick={clearAll} className="rounded p-1 transition-all hover:scale-110"
            style={{ color: "var(--text-muted)" }} title="清空">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>暂无通知</p>
      ) : (
        <>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {list.map((n) => {
            const Icon = notificationIconMap[n.type] ?? Info;
            const t = new Date(n.created_at);
            const timeStr = t.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition-all hover:bg-opacity-50"
                style={{ background: n.read ? "transparent" : "var(--bg-secondary)" }}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <Icon size={14} style={{ color: n.read ? "var(--text-muted)" : "var(--accent-primary)" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "#ef4444" }} />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs truncate" style={{ color: "var(--text-muted)" }}>{n.message}</p>
                  <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                    {timeStr}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => navigate("/notifications")}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs transition-all hover:scale-[1.02]"
          style={{
            color: "var(--accent-primary)",
            border: "1px solid var(--border-card)",
          }}
        >
          <ExternalLink size={11} />
          查看全部
        </button>
        </>
      )}
    </div>
  );
}
