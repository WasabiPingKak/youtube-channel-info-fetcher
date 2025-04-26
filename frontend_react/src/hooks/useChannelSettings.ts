import { useState, useEffect } from "react";
import { loadChannelSettings, saveChannelSettings } from "../lib/firestore";
import { toast } from "react-toastify";

interface ChannelSettings {
  live: {
    遊戲: GameCategoryItem[];
    雜談: string[];
    音樂: string[];
    節目: string[];
    其他: string[];
  };
  videos: {
    遊戲: GameCategoryItem[];
    雜談: string[];
    音樂: string[];
    節目: string[];
    其他: string[];
  };
  shorts: {
    遊戲: GameCategoryItem[];
    雜談: string[];
    音樂: string[];
    節目: string[];
    其他: string[];
  };
}

interface GameCategoryItem {
  game: string;
  keywords: string[];
}

const createDefaultSettings = (): ChannelSettings => ({
  live: {
    遊戲: [],
    雜談: [],
    音樂: [],
    節目: [],
    其他: []
  },
  videos: {
    遊戲: [],
    雜談: [],
    音樂: [],
    節目: [],
    其他: []
  },
  shorts: {
    遊戲: [],
    雜談: [],
    音樂: [],
    節目: [],
    其他: []
  }
});

/**
 * 自訂 Hook：讀取與儲存指定頻道的分類設定
 * @param channelId 頻道 ID
 */
export const useChannelSettings = (channelId: string) => {
  const [channelSettings, setChannelSettings] = useState<ChannelSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!channelId) return;
      setLoading(true);
      try {
        const response = await loadChannelSettings(channelId);

        if (response.success) {
          setChannelSettings(response.settings);
        } else if (response.code === "not-found") {
          const defaultSettings = createDefaultSettings();
          setChannelSettings(defaultSettings);
          toast.info("尚未設定分類，已載入預設設定");
        } else {
          toast.error(`讀取分類設定失敗：${response.error || "未知錯誤"}`);
          console.error("load-category-settings failed:", response);
        }
      } catch (error) {
        toast.error("讀取分類設定失敗");
        console.error("load-category-settings error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [channelId]);

  const saveSettings = async () => {
    if (!channelId || !channelSettings) return;
    setLoading(true);
    try {
      const response = await saveChannelSettings(channelId, channelSettings);
      if (response.success) {
        toast.success("分類設定已成功儲存");
      } else {
        toast.error(`儲存分類設定失敗：${response.error || "未知錯誤"}`);
        console.error("save-channel-settings failed:", response);
      }
    } catch (error) {
      toast.error("儲存分類設定失敗");
      console.error("save-channel-settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { channelSettings, setChannelSettings, saveSettings, loading };
};
