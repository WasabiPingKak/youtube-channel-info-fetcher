/**
 * useEditorData
 * -------------
 * 透過 TanStack Query 取得 CategoryEditor 初始化資料
 * QueryKey: ['editorData', channelId]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { CategoryConfig, Video } from '../types/editor';

export interface EditorDataResponse {
  config: CategoryConfig;
  videos: Video[];
}

/** 5 分鐘 (ms) */
const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * 讀取指定頻道的分類設定與影片清單
 * @param channelId Firestore channel document ID
 */
export function useEditorData(
  channelId: string | undefined
): UseQueryResult<EditorDataResponse> {
  return useQuery<EditorDataResponse>({
    queryKey: ['editorData', channelId],
    enabled: !!channelId,
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
    queryFn: async () => {
      const res = await fetch(
        `/api/categories/editor-data?channel_id=${encodeURIComponent(
          channelId!
        )}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to fetch editor data');
      }
      return (await res.json()) as EditorDataResponse;
    },
  });
}
