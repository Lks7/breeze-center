/**
 * Admin API — 各实体的 CRUD 调用封装
 */

import { api } from "./client";
import type {
  BlogPost,
  RSSSource,
  RSSArticle,
  Bookmark,
  Todo,
  ServiceEntry,
  FundHolding,
  FundHoldingInput,
  FundSummary,
  FundNavUpdateResponse,
  FundNavHistory,
  FundHistoryItem,
  DailyProfitRecord,
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
  listArticles: (params?: { source_id?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.source_id) query.set("source_id", params.source_id);
    if (params?.limit) query.set("limit", params.limit.toString());
    return api.get<RSSArticle[]>(`/admin/rss/articles?${query}`);
  },
};

export const bookmarkAPI = collection<Bookmark>("bookmarks");
export const todoAPI = {
  ...collection<Todo>("todos"),
  toggle: (id: string) =>
    api.patch<Todo>(`/admin/todos/${id}/toggle`),
  listCompletedDates: (month: string) =>
    api.get<string[]>(`/admin/todos/completed-dates?month=${month}`),
  updatePosition: (id: string, x: number, y: number) =>
    api.patch<{status: string}>(`/admin/todos/${id}/position`, {position_x: x, position_y: y}),
};
export const serviceAPI = collection<ServiceEntry>("services");

export const fundAPI = {
  listHoldings: () => api.get<FundHolding[]>("/admin/fund/holdings"),
  createHolding: (body: FundHoldingInput) =>
    api.post<FundHolding>("/admin/fund/holdings", body),
  updateHolding: (id: string, body: FundHoldingInput) =>
    api.put<FundHolding>(`/admin/fund/holdings/${id}`, body),
  deleteHolding: (id: string) =>
    api.del<{ deleted: boolean }>(`/admin/fund/holdings/${id}`),
  updateNavs: () =>
    api.post<FundNavUpdateResponse>("/admin/fund/update-navs", {}),
  updateOneNav: (id: string) =>
    api.post<FundHolding>(`/admin/fund/holdings/${id}/update-nav`, {}),
  getSummary: () => api.get<FundSummary>("/admin/fund/summary"),
  getHoldingHistory: (id: string, limit = 365) =>
    api.get<FundNavHistory[]>(`/admin/fund/holdings/${id}/history?limit=${limit}`),
  getAllHistory: (limit = 1000) =>
    api.get<FundHistoryItem[]>(`/admin/fund/history?limit=${limit}`),
  getDailyProfit: (days = 30) =>
    api.get<DailyProfitRecord[]>(`/admin/fund/daily-profit?days=${days}`),
};
