// src/hooks/useMyChannelId.ts
import { useQuery } from "@tanstack/react-query";

export type MeResponse = {
  channelId: string | null;
  isAdmin: boolean;
  name?: string | null;
  thumbnail?: string | null;
};

const BASE_URL = import.meta.env.VITE_API_BASE || "";

export function useMyChannelId() {
  return useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();

        // 兼容目前後端：你原本 /api/me 對匿名訪問會回 200 {channelId:null}
        // 若未來改成 401 也能吃
        if (res.status === 401 || res.status === 403) {
          console.warn("⚠️ /api/me：未登入或 token 無效。", res.status, text);
          return { channelId: null, isAdmin: false };
        }

        console.error("❌ 取得 /api/me 失敗：", res.status, text);
        throw new Error(`Failed to fetch /api/me: ${res.status}`);
      }

      const json = await res.json();

      return {
        channelId: json?.channelId ?? null,
        isAdmin: Boolean(json?.isAdmin),
        name: json?.name ?? null,
        thumbnail: json?.thumbnail ?? null,
      };
    },
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}
