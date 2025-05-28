import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ChannelInfo {
  name: string;
  url: string;
  thumbnail: string;
  countryCode?: string[];
  enabled: boolean;
}

export function useChannelInfo(channelId: string) {
  const [data, setData] = useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelId) {
      console.warn("⚠️ 未提供有效的 channelId");
      return;
    }

    const fetchChannelInfo = async () => {
      setIsLoading(true);
      setError(null);

      console.log("🎯 正在嘗試讀取 Firestore channel_info：", channelId);
      const docRef = doc(db, "channel_data", channelId, "channel_info", "info");
      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const raw = docSnap.data();
          console.log("📦 channelId = ", channelId);
          console.log("📦 countryCode = ", raw?.countryCode);
          console.log("📦 enabled = ", raw?.enabled);

          console.log("✅ 取得資料：", raw);
          setData(raw as ChannelInfo);
        } else {
          console.warn("⚠️ 找不到該頻道資訊文件");
          setData(null);
        }
      } catch (err) {
        console.error("❌ Firestore 讀取錯誤：", err);
        setError(err instanceof Error ? err : new Error("未知錯誤"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelInfo();
  }, [channelId]);

  return { data, isLoading, error };
}
