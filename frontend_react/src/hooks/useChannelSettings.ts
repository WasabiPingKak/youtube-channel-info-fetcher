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
    video: {
      精華: [],
      其他: []
    },
    shorts: {
      其他: []
    }
  },
  game_tags: {}
};

export const useChannelSettings = () => {
  const [channelSettings, setChannelSettings] = useState<ChannelSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await loadChannelSettings();
      if (data) {
        setChannelSettings(data);
      } else {
        setChannelSettings(defaultSettings);
        toast.info("⚠ 資料庫中尚無分類設定，已套用預設結構，請新增內容後儲存。");
      }
    })();
  }, []);

  const saveSettings = async () => {
    setLoading(true);
    try {
      if (channelSettings) {
        await saveChannelSettings(channelSettings);
        toast.success("設定已成功儲存！");
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
