import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

/** 影片物件型別（沿用舊版） */
export interface VideoItem {
  videoId: string;
  title: string;
  publishDate: string;
  duration: number;
  game?: string;
  matchedKeywords?: string[];
  matchedCategories?: string[];
  /** 其他欄位動態擴充 */
  [key: string]: any;
}

/**
 * 影片清單快取 Hook（TanStack Query 版）
 *
 * @param channelId 頻道 ID，預設 "UCLxa0YOtqi8IR5r2dSLXPng"
 * @param videoType 影片類型：'live' | 'videos' | 'shorts'，預設 'videos'
 *
 * 注意：
 * 目前 Firestore 並未依類型分 collection，
 * 因此取回所有影片後再由前端依 videoType 過濾。
 */
export function useVideoCache(
  channelId: string = "UCLxa0YOtqi8IR5r2dSLXPng",
  videoType: "live" | "videos" | "shorts" = "videos"
) {
  /* --- TanStack Query：統一管理快取 --- */
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["videos", channelId, videoType], // ← 快取單位
    /**
     * 真正去拿資料的函式（queryFn）
     * 仍舊從 Firestore 讀取，無須經過後端 Flask。
     */
    queryFn: async () => {
      const [videosSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, `channel_data/${channelId}/videos`)),
        getDoc(doc(db, `channel_data/${channelId}/settings/config`)),
      ]);

      /** 轉成陣列並加上 doc.id → videoId */
      const allVideos: VideoItem[] = videosSnap.docs.map((d) => ({
        videoId: d.id,
        ...d.data(),
      })) as VideoItem[];

      /** 依 videoType 做前端過濾（示例欄位：isLive / isShort，可視你的 schema 調整） */
      const filteredVideos = allVideos.filter((v) => {
        switch (videoType) {
          case "live":
            return v.isLive === true;
          case "shorts":
            return v.isShort === true;
          case "videos": // 一般影片：排除 live 與 shorts
          default:
            return v.isLive !== true && v.isShort !== true;
        }
      });

      const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;

      /* 回傳物件將被快取，供 Hook 使用者取用 */
      return {
        videos: filteredVideos,
        categorySettings: settingsData,
      };
    },
    /* 5 分鐘快取（正式環境）；開發環境強制 0 → 每次重抓 */
    staleTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  /* --- 統一回傳格式，保持與舊版一致的欄位名稱 --- */
  return {
    videos: data?.videos ?? [],
    categorySettings: data?.categorySettings ?? null,
    loading: isLoading,
    error: error as Error | null,
  };
}
