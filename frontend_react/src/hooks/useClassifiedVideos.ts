import { useQuery } from "@tanstack/react-query";

export interface ClassifiedVideoItem {
  videoId: string;
  title: string;
  publishDate: string;
  duration: number;
  type: "live" | "videos" | "shorts";
  matchedCategories: string[];
  game?: string | null;
  matchedKeywords?: string[];
  matchedPairs?: { keyword: string; main: string }[];
  [key: string]: any;
}

const BASE_URL = import.meta.env.VITE_API_BASE || "";

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
      const res = await fetch(`${BASE_URL}/api/videos/classified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channelId,
          video_type: videoType,
        }),
      });

      if (!res.ok) {
        throw new Error("分類影片 API 請求失敗");
      }

      const classifiedData = await res.json();
      const videos = classifiedData.videos as ClassifiedVideoItem[];

      // ✅ 印出影片總數與關鍵資訊以利除錯
      console.log(`📦 取得 ${videos.length} 部影片（type=${videoType}）`);
      videos.forEach((v) => {
        // console.log(`🧩 ${v.title} | matchedCategories:`, v.matchedCategories ?? []);
      });

      return { videos };
    },

    staleTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    videos: data?.videos ?? [],
    loading: isLoading,
    error: error as Error | null,
  };
}
