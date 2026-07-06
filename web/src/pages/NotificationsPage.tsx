import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  Info,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { notificationAPI, type Notification } from "@/api/notification";
import { notificationIconMap, formatNotificationTime } from "@/utils/notifications";

const FETCH_LIMIT = 200;

export function NotificationsPage() {
  const qc = useQueryClient();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const {
    data: notifications = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationAPI.list(FETCH_LIMIT),
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    qc.setQueryData<Notification[]>(["notifications", "list"], (prev) =>
      prev?.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try { await notificationAPI.markRead(id); } catch { /* */ }
  };

  const handleMarkAllRead = async () => {
    qc.setQueryData<Notification[]>(["notifications", "list"], (prev) =>
      prev?.map((n) => ({ ...n, read: true })) ?? []
    );
    try { await notificationAPI.markAllRead(); } catch { /* */ }
  };

  const handleClearAll = async () => {
    setShowClearConfirm(false);
    qc.setQueryData(["notifications", "list"], []);
    try { await notificationAPI.clear(); } catch { /* */ }
  };

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
          <GradientText>通知中心</GradientText>
        </h1>
      </div>

      {/* 工具栏 */}
      <GlassCard className="mb-4 !p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: "var(--accent-primary)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              共 {notifications.length} 条通知
            </span>
            {unreadCount > 0 && (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {unreadCount} 条未读
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 disabled:opacity-40"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-card)",
              }}
            >
              <CheckCheck size={13} />
              全部已读
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={notifications.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 disabled:opacity-40"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-card)",
              }}
            >
              <Trash2 size={13} />
              清空通知
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 加载状态 */}
      {isLoading && (
        <div
          className="flex items-center gap-2 py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      )}

      {/* 加载中刷新指示器（非首次加载） */}
      {!isLoading && isFetching && (
        <div className="mb-2 flex justify-end">
          <Loader2 size={12} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && notifications.length === 0 && (
        <GlassCard interactive={false} className="py-16 text-center">
          <Bell
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            暂无通知
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            新的通知会在这里显示
          </p>
        </GlassCard>
      )}

      {/* 通知列表 */}
      {!isLoading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}

      {/* 清空确认对话框 */}
      {showClearConfirm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowClearConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-sm !p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(239, 68, 68, 0.15)" }}
                >
                  <AlertTriangle size={20} style={{ color: "#ef4444" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    清空所有通知
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    此操作不可撤销，将删除全部 {notifications.length} 条通知
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-card)",
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleClearAll}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-90"
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                  }}
                >
                  确认清空
                </button>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationCard({
  notification: n,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const Icon = notificationIconMap[n.type] ?? Info;

  return (
    <button
      onClick={() => !n.read && onMarkRead(n.id)}
      className="glass-card flex w-full items-start gap-3 p-4 text-left transition-all hover:scale-[1.01]"
      style={{
        opacity: n.read ? 0.7 : 1,
        borderLeft: n.read
          ? "3px solid transparent"
          : "3px solid var(--accent-primary)",
      }}
    >
      {/* 图标 */}
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: n.read
            ? "var(--bg-card)"
            : "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
          color: n.read ? "var(--text-muted)" : "var(--accent-primary)",
        }}
      >
        <Icon size={18} />
      </div>

      {/* 内容 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: n.read ? "var(--text-secondary)" : "var(--text-primary)" }}
          >
            {n.title}
          </span>
          <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
            {formatNotificationTime(n.created_at)}
          </span>
        </div>
        <p
          className="mt-1 text-sm leading-relaxed line-clamp-3"
          style={{ color: "var(--text-secondary)" }}
        >
          {n.message}
        </p>

        {/* 类型标签 */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-xs"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-muted)",
            }}
          >
            {n.type}
          </span>
          {!n.read && (
            <span
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: "var(--accent-primary)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ef4444" }} />
              未读
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
