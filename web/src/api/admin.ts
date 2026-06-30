/**
 * Admin API — 各实体的 CRUD 调用封装
 */

import { api } from "./client";
import type {
  BlogPost,
  RSSSource,
  Bookmark,
  Todo,
  ServiceEntry,
} from "@/types/entities";

const collection = <T>(path: string) => ({
  list: () => api.get<T[]>(`/admin/${path}`),
  create: (body: Partial<T>) => api.post<T>(`/admin/${path}`, body),
  update: (id: string, body: Partial<T>) => api.put<T>(`/admin/${path}/${id}`, body),
  delete: (id: string) => api.del<{ status: string }>(`/admin/${path}/${id}`),
});

export const blogAPI = {
  ...collection<BlogPost>("blog/posts"),
};

export const rssAPI = {
  listSources: () => api.get<RSSSource[]>("/admin/rss/sources"),
  createSource: (body: Partial<RSSSource>) =>
    api.post<RSSSource>("/admin/rss/sources", body),
  updateSource: (id: string, body: Partial<RSSSource>) =>
    api.put<RSSSource>(`/admin/rss/sources/${id}`, body),
  deleteSource: (id: string) =>
    api.del<{ status: string }>(`/admin/rss/sources/${id}`),
  fetchNow: () =>
    api.post<{ status: string; message: string }>("/admin/rss/fetch", {}),
};

export const bookmarkAPI = collection<Bookmark>("bookmarks");
export const todoAPI = {
  ...collection<Todo>("todos"),
  toggle: (id: string) =>
    api.patch<Todo>(`/admin/todos/${id}/toggle`),
};
export const serviceAPI = collection<ServiceEntry>("services");
