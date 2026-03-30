import { useEffect, useState } from "react";

export interface ChannelInfo {
  name: string;
  url: string;
  thumbnail: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function useMultipleChannelInfo(channelIds: string[]) {
  const [data, setData] = useState<Record<string, ChannelInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelIds || channelIds.length === 0) return;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/channels/info/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel_ids: channelIds }),
        });

        if (!res.ok) {
          throw new Error(`HTTP 錯誤：${res.status}`);
        }

        const result = await res.json();
        if (result.success) {
          setData(result.channels);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [channelIds]);

  return { data, isLoading, error };
}
