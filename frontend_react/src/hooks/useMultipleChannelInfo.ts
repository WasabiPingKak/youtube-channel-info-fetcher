import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ChannelInfo {
  name: string;
  url: string;
  thumbnail: string;
}

export function useMultipleChannelInfo(channelIds: string[]) {
  const [data, setData] = useState<Record<string, ChannelInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelIds || channelIds.length === 0) return;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      const results: Record<string, ChannelInfo> = {};

      try {
        for (const channelId of channelIds) {
          const docRef = doc(db, "channel_data", channelId, "channel_info", "info");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            results[channelId] = docSnap.data() as ChannelInfo;
          }
        }
        setData(results);
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
