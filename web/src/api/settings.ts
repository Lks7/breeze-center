import { api } from "./client";

export const settingsAPI = {
  async get(key: string): Promise<string> {
    const data = await api.get<{ value: string }>(`/settings/${key}`);
    return data?.value ?? "";
  },

  async set(key: string, value: string): Promise<void> {
    await api.put(`/settings/${key}`, { value });
  },
};
