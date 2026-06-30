/**
 * API client — 与 Go 后端通信的统一入口
 *
 * 所有方法返回解析后的 data 字段，错误时 throw Error。
 * 后端响应格式：{ success: boolean, data?: T, error?: {code, message} }
 */

const BASE = "/api/v1";

export class APIError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json: Envelope<T> = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !json.success) {
    throw new APIError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? `HTTP ${res.status}`,
      res.status
    );
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
