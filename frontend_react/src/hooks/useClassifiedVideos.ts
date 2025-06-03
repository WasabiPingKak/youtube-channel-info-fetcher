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
  matchedPairs?: { main: string; keyword: string; hitKeywords: string[] }[];
  [key: string]: any;
}

const BASE_URL = import.meta.env.VITE_API_BASE || "";

export function useClassifiedVideos(
  channelId: string,
  videoType?: "live" | "videos" | "shorts"
) {
  const {
    data,
    isLoading,
    error,
    refetch,
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
      const rawVideos = classifiedData.videos as ClassifiedVideoItem[];

      // ✅ 自動補上「未分類」分類（若無命中任何分類）
      const videos = rawVideos.map((v) => {
        const hasNoMatch =
          (!v.matchedCategories || v.matchedCategories.length === 0) &&
          (!v.matchedPairs || v.matchedPairs.length === 0);

        if (hasNoMatch) {
          return {
            ...v,
            matchedCategories: ["未分類"],
            matchedPairs: [{ main: "未分類", keyword: "", hitKeywords: [] }],
          };
        }
        return v;
      });

      console.log(`📦 取得 ${videos.length} 部影片（type=${videoType}）`);
      return { videos };
    },
    // staleTime: import.meta.env.DEV ? 0 : 1 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    videos: data?.videos ?? [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
