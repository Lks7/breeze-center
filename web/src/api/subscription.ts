import { api } from "./client";

export interface Subscription {
  id: string;
  name: string;
  type: string;
  provider: string;
  expire_date: string;
  price: number;
  cycle: string;
  status: string;
  notify_days: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export const subscriptionAPI = {
  list: () => api.get<Subscription[]>("/admin/subscriptions"),

  create: (data: Omit<Subscription, "id" | "status" | "created_at" | "updated_at">) =>
    api.post("/admin/subscriptions", data),

  update: (id: string, data: Partial<Subscription>) =>
    api.put<Subscription>(`/admin/subscriptions/${id}`, data),

  delete: (id: string) => api.del(`/admin/subscriptions/${id}`),

  getExpiring: (days = 30) => api.get<Subscription[]>(`/subscriptions/expiring?days=${days}`),
};
