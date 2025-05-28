import { useEffect } from "react";

export const useAutoUpdateVideos = (channelId: string) => {
  useEffect(() => {
    const runUpdateCheck = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/videos/check-update?channelId=${channelId}`
        );
        const data = await res.json();

        if (data.shouldUpdate && data.updateToken) {
          await fetch(`${import.meta.env.VITE_API_BASE}/api/videos/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId,
              updateToken: data.updateToken,
            }),
          });
        }
      } catch (e) {
        console.warn("🔁 頻道初始化自動更新失敗", e);
      }
    };

    runUpdateCheck();
  }, [channelId]);
};
