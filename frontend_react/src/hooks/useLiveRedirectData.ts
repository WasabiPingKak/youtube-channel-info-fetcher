// hooks/useLiveRedirectData.ts
import { useQuery } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_BASE || "";

type LiveInfo = {
  videoId: string;
  title: string;
  startTime: string;
  viewers: number;
  isUpcoming: boolean;
  endTime: string | null;
};

export type ChannelData = {
  channel_id: string;
  name: string;
  thumbnail: string;
  badge: string;
  countryCode: string[];
  live: LiveInfo;
};

type LiveRedirectCacheResponse = {
  updatedAt: string;
  channels: ChannelData[];
};

export function useLiveRedirectData() {
  return useQuery({
    queryKey: ["liveRedirectCache"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/live-redirect/cache`);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ 取得 /api/live-redirect/cache 失敗：", res.status, text);
        throw new Error(`Failed to fetch /api/live-redirect/cache: ${res.status}`);
      }

      const json: LiveRedirectCacheResponse = await res.json();

      const now = new Date();
      const nowMs = now.getTime();
      const upcomingLimitMs = nowMs + 15 * 60 * 1000;
      const endedLimitMs = nowMs - 60 * 60 * 12000;

      const upcoming: ChannelData[] = [];
      const live: ChannelData[] = [];
      const ended: ChannelData[] = [];

      for (const channel of json.channels) {
        const info = channel.live;
        if (!info) continue;

        const startTimeMs = Date.parse(info.startTime);
        if (isNaN(startTimeMs)) continue;

        if (info.endTime) {
          const endTimeMs = Date.parse(info.endTime);
          if (!isNaN(endTimeMs) && endTimeMs >= endedLimitMs) {
            ended.push(channel);
          }
        } else if (info.isUpcoming) {
          if (startTimeMs <= upcomingLimitMs) {
            upcoming.push(channel);
          }
        } else {
          if (startTimeMs <= nowMs) {
            live.push(channel);
          }
        }
      }

      return {
        updatedAt: json.updatedAt,
        upcoming,
        live,
        ended,
      };
    },
    // gcTime: 1000 * 60 * 5,
    retry: false,
  });
}
