import { api } from "./client";

/**
 * 融合站点类型
 */
export interface FusionSite {
  id: string;
  name: string;
  url: string;
  description: string;
  icon_color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FusionSiteInput {
  name: string;
  url: string;
  description: string;
  icon_color: string;
  sort_order: number;
}

/**
 * 融合站点 API
 */
export const fusionAPI = {
  /**
   * 获取所有融合站点
   */
  list: () => api.get<FusionSite[]>("/admin/fusion"),

  /**
   * 获取单个融合站点
   */
  get: (id: string) => api.get<FusionSite>(`/admin/fusion/${id}`),

  /**
   * 创建融合站点
   */
  create: (input: FusionSiteInput) =>
    api.post<FusionSite>("/admin/fusion", input),

  /**
   * 更新融合站点
   */
  update: (id: string, input: FusionSiteInput) =>
    api.put<FusionSite>(`/admin/fusion/${id}`, input),

  /**
   * 删除融合站点
   */
  delete: (id: string) => api.del<void>(`/admin/fusion/${id}`),
};
