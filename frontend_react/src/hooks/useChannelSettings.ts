import { useState, useEffect } from "react";
import { loadChannelSettings, saveChannelSettings } from "@/lib/firestore";
import { toast } from "react-toastify";

interface ChannelSettings {
  classifications: {
    [type: string]: {
      [category: string]: string[];
    };
  };
  game_tags: {
    [game: string]: string[];
  };
}

const defaultSettings: ChannelSettings = {
  classifications: {
    live: {
      雜談: [],
      遊戲: [],
      音樂: [],
      繪畫: [],
      節目: [],
      其他: []
    },
    videos: {
      精華: [],
      其他: []
    },
    shorts: {
      其他: []
    }
  },
  game_tags: {}
};

/**
 * 自訂 Hook：讀取與儲存指定頻道的分類設定
 * @param channelId 頻道 ID
 */
export const useChannelSettings = (channelId: string) => {
  const [channelSettings, setChannelSettings] = useState<ChannelSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadChannelSettings(channelId);
        if (data) {
          setChannelSettings(data as ChannelSettings);
        } else {
          setChannelSettings(defaultSettings);
          toast.info("⚠ 資料庫中尚無分類設定，已套用預設結構，請新增內容後儲存。");
        }
      } catch (error) {
        console.error("讀取分類設定失敗：", error);
        toast.error("讀取分類設定失敗，請稍後再試！");
      }
    })();
  }, [channelId]); // ✅ 依 channelId 切換

  const saveSettings = async () => {
    setLoading(true);
    try {
      if (channelSettings) {
        const updatedCount = await saveChannelSettings(channelId, channelSettings);
        if (updatedCount >= 0) {
          toast.success(`設定成功，已更新 ${updatedCount} 筆影片`);
        } else {
          toast.error("後端未回傳成功訊息！");
        }
      }
    } catch (err) {
      console.error("寫入失敗：", err);
      toast.error("儲存失敗，請稍後再試！");
    } finally {
      setLoading(false);
    }
  };

  return { channelSettings, setChannelSettings, saveSettings, loading };
};
