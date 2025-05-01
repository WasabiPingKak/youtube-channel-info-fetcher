import { useQuery } from "@tanstack/react-query";
import type { CategoryConfig, Video } from "../types/editor";

export interface EditorDataResponse {
  config: CategoryConfig;
  videos: Video[];
  removedSuggestedKeywords: string[];
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function useEditorData(channelId?: string) {
  return useQuery<EditorDataResponse>({
    enabled: !!channelId,
    queryKey: ["editor-data", channelId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/categories/editor-data?channel_id=${encodeURIComponent(channelId!)}`
      );
      if (!res.ok) {
        throw new Error("無法讀取分類設定資料");
      }
      return res.json();
    },
  });
}
