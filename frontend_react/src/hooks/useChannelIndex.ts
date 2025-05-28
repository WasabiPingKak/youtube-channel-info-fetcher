import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ChannelIndexInfo {
  name: string;
  url: string;
  thumbnail: string;
  countryCode: string[];
  enabled: boolean;
  priority: number;
}

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

      console.log("🎯 正在嘗試讀取 Firestore channel_index：", channelId);
      const docRef = doc(db, "channel_index", channelId);
      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const raw = docSnap.data();
          setData(raw as ChannelIndexInfo);
        } else {
          console.warn("⚠️ 找不到該頻道索引文件");
          setData(null);
        }
      } catch (err) {
        console.error("❌ Firestore 讀取錯誤：", err);
        setError(err instanceof Error ? err : new Error("未知錯誤"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelIndexInfo();
  }, [channelId]);

  return { data, isLoading, error };
}
