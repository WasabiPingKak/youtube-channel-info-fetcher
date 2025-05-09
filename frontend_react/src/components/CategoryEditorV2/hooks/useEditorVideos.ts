import { useQuery } from "@tanstack/react-query";
import type { Video } from "../types/editor";

/**
 * Hook 回傳影片清單，並維持 12 小時快取
 */
export function useEditorVideos(channelId?: string) {
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  return useQuery<Video[]>({
    enabled: !!channelId,
    queryKey: ["editor-videos", channelId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/categories/editor-data-v2?channel_id=${encodeURIComponent(
          channelId!
        )}`
      );
      if (!res.ok) {
        throw new Error("無法讀取影片清單");
      }
      const data = await res.json();
      // 假設 API 回傳的 JSON 包含 videos 欄位
      return data.videos as Video[];
    },
    // 設定 12 小時快取 (staleTime) 及垃圾回收時間 (gcTime)
    staleTime: 1000 * 60 * 60 * 0,
    gcTime: 1000 * 60 * 60 * 0,
  });
}
