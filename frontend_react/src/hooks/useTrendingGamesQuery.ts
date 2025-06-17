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

export interface ChannelVideoGroup {
  channelName: string;
  videos: {
    id: string;
    title: string;
    publishedAt: string;
    thumbnail: string;
    url: string;
  }[];
}

export interface TrendingGamesResponse {
  dates: string[];
  gameList: string[];
  videoCountByGameAndDate: {
    [game: string]: {
      [date: string]: number;
    };
  };
  contributorsByDateAndGame: {
    [date: string]: {
      [game: string]: {
        [channelId: string]: {
          channelName: string;
          count: number;
        };
      };
    };
  };
  details: {
    [game: string]: {
      [channelId: string]: ChannelVideoGroup;
    };
  };
  channelInfo: {
    [channelId: string]: {
      name: string;
      thumbnail: string;
      url: string;
    };
  };
}


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
