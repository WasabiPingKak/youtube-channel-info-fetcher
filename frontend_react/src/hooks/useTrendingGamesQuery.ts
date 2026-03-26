import { useQuery } from "@tanstack/react-query";
import type { TrendingGamesResponse } from "@/types/trending";

export type { VideoItem, SummaryStats, ChartDataPoint, ChannelVideoGroup, TrendingGamesResponse } from "@/types/trending";

const API_BASE = import.meta.env.VITE_API_BASE || "";


export const useTrendingGamesQuery = (days: 7 | 14 | 30 = 30) => {
  return useQuery<TrendingGamesResponse>({
    queryKey: ["trending-games", days],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/trending-games?days=${days}`);
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
