import { useQuery } from "@tanstack/react-query";
import type { CategoryConfig } from "../types/editor";

/**
 * Hook 回傳分類設定與已移除的建議關鍵字，不快取，確保每次都取最新設定
 */
export interface EditorConfigResponse {
  config: CategoryConfig;
  removedSuggestedKeywords: string[];
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function useEditorData(channelId?: string) {
  return useQuery<EditorConfigResponse>({
    enabled: !!channelId,
    queryKey: ["editor-config", channelId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/categories/editor-data-v2?channel_id=${encodeURIComponent(
          channelId!
        )}`
      );
      if (!res.ok) {
        throw new Error("無法讀取分類設定資料");
      }
      // 只取回 config 與 removedSuggestedKeywords
      const { config, removedSuggestedKeywords } = await res.json();
      return { config, removedSuggestedKeywords };
    },
    // 不設定 staleTime，預設為 0，每次掛載都會重新取最新設定
  });
}
