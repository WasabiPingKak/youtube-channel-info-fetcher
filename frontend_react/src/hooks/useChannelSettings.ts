import { useState, useEffect } from "react";
import { loadChannelSettings, saveChannelSettings } from "@/lib/firestore";
import { toast } from "react-toastify";

export const useChannelSettings = () => {
  const [channelSettings, setChannelSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await loadChannelSettings();
      if (data) setChannelSettings(data);
    })();
  }, []);

  const saveSettings = async () => {
    setLoading(true);
    try {
      await saveChannelSettings(channelSettings);
      toast.success("設定已成功儲存！");
    } catch (err) {
      console.error("寫入失敗：", err);
      toast.error("儲存失敗，請稍後再試！");
    } finally {
      setLoading(false);
    }
  };

  return { channelSettings, setChannelSettings, saveSettings, loading };
};
