import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ClassifiedVideoItem {
  videoId: string;
  title: string;
  publishDate: string;
  duration: number;
  type: "live" | "videos" | "shorts";
  matchedCategories: string[];
  game?: string | null;
  matchedKeywords?: string[];
  [key: string]: any;
}

const BASE_URL = import.meta.env.VITE_API_BASE || "";

export interface CategorySettings {
  [videoType: string]: {
    遊戲: { game: string; keywords: string[] }[];
    [mainCategory: string]: string[] | { game: string; keywords: string[] }[];
  };
}

export function useClassifiedVideos(
  channelId: string,
  videoType: "live" | "videos" | "shorts"
) {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["classified", channelId, videoType],

    queryFn: async () => {
      const [classifiedRes, settingsSnap] = await Promise.all([
        fetch(`${BASE_URL}/api/videos/classified`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel_id: channelId,
            video_type: videoType,
          }),
        }),
        getDoc(doc(db, `channel_data/${channelId}/settings/config`)),
      ]);

      if (!classifiedRes.ok) {
        throw new Error("分類影片 API 請求失敗");
      }

      const classifiedData = await classifiedRes.json();
      const videos = classifiedData.videos as ClassifiedVideoItem[];

      // ✅ 埋 log：印出影片總數與每部影片的關鍵資訊
      console.log(`📦 取得 ${videos.length} 部影片（type=${videoType}）`);
      videos.forEach((v) => {
        // console.log(`🧩 ${v.title} | matchedKeywords:`, v.matchedKeywords ?? []);
      });

      const categorySettings = settingsSnap.exists() ? settingsSnap.data() : null;

      return { videos, categorySettings };
    },

    staleTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    videos: data?.videos ?? [],
    categorySettings: data?.categorySettings ?? null,
    loading: isLoading,
    error: error as Error | null,
  };
}
