import { useQuery } from "@tanstack/react-query";
import { computeAnnualReviewStats } from "@/utils/statistics/computeAnnualReviewStats";
import type { AnnualStatsData, SpecialStatsData } from "@/utils/statistics/types";

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
}

const BASE_URL = import.meta.env.VITE_API_BASE || "";

// 🔧 工具：取得台灣時區的 UTC 範圍
function getTaiwanYearRangeUTC(year: number) {
  const tzOffset = -8 * 60; // 台灣是 UTC+8，要轉成 UTC 需減去 8 小時
  const start = new Date(Date.UTC(year, 0, 1, 0, -tzOffset));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59 - tzOffset));
  return { start, end };
}

// 🔧 工具：時間格式轉換為 ISO 字串
function toISOStringWithTZ(d: Date) {
  return d.toISOString().replace(".000Z", "+00:00");
}

// 🧠 核心 Hook
export function useAnnualReviewData(channelId: string, year: number) {
  const { start, end } = getTaiwanYearRangeUTC(year);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["annual-review", channelId, year],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/videos/classified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channelId,
          start: toISOStringWithTZ(start),
          end: toISOStringWithTZ(end),
        }),
      });

      if (!res.ok) {
        throw new Error("年度影片資料請求失敗");
      }

      const raw = await res.json();
      const videos: ClassifiedVideoItem[] = raw.videos.map((v: ClassifiedVideoItem) => {
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

      console.log(`📦 取得 ${videos.length} 部影片（年=${year}）`);

      const { stats, special } = computeAnnualReviewStats(videos);
      return { stats, special };
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 🧯 預設空統計
  const fallbackStats: AnnualStatsData = {
    videoCounts: { shorts: 0, videos: 0, live: 0 },
    totalLiveHours: 0,
    monthlyVideoCounts: [],
    categoryTime: [],
    monthlyCategoryTime: [],
  };

  // 🧯 預設特殊統計（補全所有欄位）
  const fallbackSpecial: SpecialStatsData = {
    longestLive: null,
    longestLiveStreak: null,
    topGame: null,
    secondTopGame: null,
    distinctGameCount: 0,
    distinctGameList: [],
  };

  return {
    stats: data?.stats ?? fallbackStats,
    special: data?.special ?? fallbackSpecial,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
