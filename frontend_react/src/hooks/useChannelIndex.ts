import { useEffect, useState } from "react";

export type { ChannelIndexInfo } from "@/types/channel";
import type { ChannelIndexInfo } from "@/types/channel";

import { API_BASE } from "@/lib/api";

export function useChannelIndex(channelId: string) {
  const [data, setData] = useState<ChannelIndexInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelId) {
      console.warn("⚠️ 未提供有效的 channelId");
      return;
    }

    const fetchChannelIndexInfo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/channels/index/${channelId}`);
        if (!res.ok) {
          throw new Error(`HTTP 錯誤：${res.status}`);
        }
        const result = await res.json();
        if (result.success && result.channel) {
          setData(result.channel as ChannelIndexInfo);
        } else {
          console.warn("⚠️ 找不到該頻道索引文件");
          setData(null);
        }
      } catch (err) {
        console.error("❌ 讀取頻道索引錯誤：", err);
        setError(err instanceof Error ? err : new Error("未知錯誤"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelIndexInfo();
  }, [channelId]);

  return { data, isLoading, error };
}
