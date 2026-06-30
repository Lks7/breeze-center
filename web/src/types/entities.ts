/**
 * 类型定义 — 与后端 store 实体一一对应
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  tags: string;
  status: "draft" | "published";
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: string;
  icon_color: string;
  enabled: boolean;
  last_fetched: string;
  created_at: string;
  updated_at: string;
}

export interface RSSArticle {
  id: string;
  source_id: string;
  title: string;
  url: string;
  excerpt: string;
  published_at: string;
  fetched_at: string;
  read: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  due_date: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceEntry {
  id: string;
  base_service: string;
  name: string;
  description: string;
  category: string;
  url: string;
  api_endpoint: string;
  icon_name: string;
  icon_color: string;
  status: "active" | "inactive" | "error";
  sort_order: number;
  created_at: string;
  updated_at: string;
}
