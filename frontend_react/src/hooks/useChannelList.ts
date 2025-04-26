// src/hooks/useChannelList.ts
// -----------------------------------------------------------
// 讀取 Firestore `channel_index` 集合，回傳已啟用 (enabled == true)
// 的頻道清單，並依 priority → name 排序。
// -----------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

/** 前端使用的頻道清單物件 */
export interface ChannelListItem {
  /** Firestore 文件 ID（即 YouTube channelId） */
  id: string;
  /** 頻道名稱 */
  name: string;
  /** YouTube 頭像 URL */
  thumbnail: string;
  /** YouTube 頻道首頁 URL */
  url: string;
  /** 排序值；數字越小越前面（可選） */
  priority?: number;
}

/**
 * 讀取並快取頻道清單的 Hook
 *
 * @example
 * const { data: channels, isLoading, error } = useChannelList();
 */
export function useChannelList() {
  return useQuery<ChannelListItem[]>({
    queryKey: ["channelList"],
    /** 真正從 Firestore 抓取資料的函式 */
    queryFn: async () => {
      const colRef = collection(db, "channel_index");
      const snap = await getDocs(colRef);

      /* --- 將符合 enabled == true 的文件收集成陣列 --- */
      const list: ChannelListItem[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        if (d.enabled !== true) return; // 只保留已啟用的頻道

        list.push({
          id: docSnap.id,
          name: d.name,
          thumbnail: d.thumbnail,
          url: d.url,
          priority: typeof d.priority === "number" ? d.priority : undefined,
        });
      });

      /* --- 依 priority → name 排序 --- */
      list.sort((a, b) => {
        const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
        const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name, "zh-Hant");
      });

      return list;
    },
    /* 5 分鐘內視為新鮮資料；15 分鐘後進入 GC */
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
