/**
 * 共用 API client — 統一 base URL、credentials、Content-Type 設定
 */

export const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * 帶 credentials 的 fetch wrapper（GET / 通用）
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });
}

/**
 * POST JSON 的便捷方法
 */
export async function apiPost(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<Response> {
  return apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...init,
  });
}
