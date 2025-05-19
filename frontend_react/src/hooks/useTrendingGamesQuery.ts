import { useQuery } from "@tanstack/react-query";

export interface VideoItem {
  videoId: string;
  channelId: string;
  title: string;
  publishDate: string; // ISO string
  type: string; // "videos" | "live" | "shorts"
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export interface SummaryStats {
  [game: string]: {
    videoCount: number;
    channelCount: number;
  };
}

export interface ChartDataPoint {
  date: string;
  [game: string]: number | string; // e.g., "Minecraft": 4, ...
}

export interface TrendingGamesResponse {
  topGames: string[];
  chartData: ChartDataPoint[];
  details: {
    [game: string]: VideoItem[];
  };
  summaryStats: SummaryStats;
}

export const useTrendingGamesQuery = () => {
  return useQuery({
    queryKey: ["trending-games"],
    queryFn: async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/trending-games`);
        if (!res.ok) {
          const errText = await res.text();
          console.error("❌ [API] /trending-games 回應非 200:", errText);
          throw new Error("後端回應失敗");
        }
        const json = await res.json();
        return json;
      } catch (err) {
        console.error("🔥 [API] /trending-games 請求失敗:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
};

