// hooks/useMyChannelId.ts
import { useQuery } from "@tanstack/react-query";

type UserInfo = {
  channelId: string | null;
};

const BASE_URL = import.meta.env.VITE_API_BASE || "";

export function useMyChannelId() {
  return useQuery<UserInfo>({
    queryKey: ["myChannelId"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403) {
          console.warn("⚠️ /api/me：JWT 驗證失敗，非法 token。", text);
          return { channelId: null };
        }

        console.error("❌ 取得 /api/me 失敗：", res.status, text);
        throw new Error(`Failed to fetch /api/me: ${res.status}`);
      }

      const json = await res.json();

      if (json?.channelId === null) {
        console.log("🔓 匿名訪問 /api/me 成功");
      } else {
        console.log("✅ 登入身份 /api/me：", json?.channelId);
      }

      return json;
    },
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}
