import type { GitHubUser, GitHubRepository, GitHubEvent } from "@/types/github";

const BASE = "/api/v1";

/**
 * GitHub API 客户端
 */
export const githubAPI = {
  /**
   * 获取 GitHub 用户信息
   */
  getUser: async (): Promise<GitHubUser> => {
    const res = await fetch(`${BASE}/github/user`);
    if (!res.ok) throw new Error(`Failed to fetch GitHub user: ${res.statusText}`);
    return res.json();
  },

  /**
   * 获取仓库列表
   */
  getRepos: async (limit = 30): Promise<GitHubRepository[]> => {
    const res = await fetch(`${BASE}/github/repos?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch GitHub repos: ${res.statusText}`);
    return res.json();
  },

  /**
   * 获取最受欢迎的仓库
   */
  getPopularRepos: async (limit = 10): Promise<GitHubRepository[]> => {
    const res = await fetch(`${BASE}/github/popular?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch popular repos: ${res.statusText}`);
    return res.json();
  },

  /**
   * 获取最近活动
   */
  getEvents: async (limit = 30): Promise<GitHubEvent[]> => {
    const res = await fetch(`${BASE}/github/events?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch GitHub events: ${res.statusText}`);
    return res.json();
  },
};
