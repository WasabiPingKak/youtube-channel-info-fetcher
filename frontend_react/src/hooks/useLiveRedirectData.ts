// hooks/useLiveRedirectData.ts
import { useQuery } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_BASE || "";

import type { LiveChannelData, LiveRedirectCacheResponse } from "@/types/live";

export type { LiveChannelData, LiveInfo, LiveRedirectCacheResponse } from "@/types/live";
/** @deprecated 請改用 LiveChannelData */
export type ChannelData = LiveChannelData;

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

      const upcoming: LiveChannelData[] = [];
      const live: LiveChannelData[] = [];
      const ended: LiveChannelData[] = [];

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
          const delayLimitMs = startTimeMs + 15 * 60 * 1000;
          if (startTimeMs <= upcomingLimitMs && delayLimitMs >= nowMs) {
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
