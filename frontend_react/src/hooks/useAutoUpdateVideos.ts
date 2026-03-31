import { useEffect } from "react";
import { apiFetch, apiPost } from "@/lib/api";

export const useAutoUpdateVideos = (channelId: string) => {
  useEffect(() => {
    const runUpdateCheck = async () => {
      try {
        const res = await apiFetch(
          `/api/videos/check-update?channelId=${channelId}`
        );
        const data = await res.json();

        if (data.shouldUpdate && data.updateToken) {
          await apiPost("/api/videos/update", {
            channelId,
            updateToken: data.updateToken,
          });
        }
      } catch (e) {
        console.warn("🔁 頻道初始化自動更新失敗", e);
      }
    };

    runUpdateCheck();
  }, [channelId]);
};
