/**
 * Poetry API — 古诗代理（后端转发，避免 CORS）
 */

import { api } from "./client";

export interface Poem {
  title: string;
  content: string[];
  author: string;
  dynasty: string;
}

export const poetryAPI = {
  random: () => api.get<Poem>("/poetry/random"),
};
