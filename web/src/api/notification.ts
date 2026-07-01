import { api } from "./client";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const notificationAPI = {
  async list(limit = 50): Promise<Notification[]> {
    const data = await api.get<Notification[]>(`/notifications?limit=${limit}`);
    return data ?? [];
  },

  async markRead(id: string) {
    return api.put(`/notifications/${id}/read`, {});
  },

  async markAllRead() {
    return api.put("/notifications/read-all", {});
  },

  async clear() {
    return api.del("/notifications");
  },
};
