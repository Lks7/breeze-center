import { useState, useEffect, useCallback } from "react";
import { notificationAPI, type Notification } from "@/api/notification";

let globalPollId: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL = 30_000; // 30 秒轮询

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetch = useCallback(async () => {
    try {
      const data = await notificationAPI.list(50);
      setNotifications(data);
    } catch { /* 忽略轮询错误 */ }
  }, []);

  useEffect(() => {
    fetch();
    if (!globalPollId) {
      globalPollId = setInterval(fetch, POLL_INTERVAL);
    }
    return () => {
      // 不清除全局定时器，多个组件可能共享
    };
  }, [fetch]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try { await notificationAPI.markRead(id); } catch { /* */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await notificationAPI.markAllRead(); } catch { /* */ }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try { await notificationAPI.clear(); } catch { /* */ }
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, clearAll, refetch: fetch };
}
