import { useEffect, useState } from "react";
import { useMyChannelId } from "@/hooks/useMyChannelId";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { showSuccessToast, showFailureToast, showLoginRequiredToast, showPermissionDeniedToast } from "@/components/common/ToastManager";

interface MySettingsResponse {
  enabled: boolean;
  countryCode: string[];
  name: string;
  thumbnail: string;
  channel_id: string;
}

export function useMySettings() {
  const { data: user } = useMyChannelId();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [channelInfo, setChannelInfo] = useState<MySettingsResponse | null>(null);
  const queryClient = useQueryClient();

  // ✅ 提取出 fetchSettings 讓內外可用
  const fetchSettings = async (channelId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/my-settings/get?channelId=${channelId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data: MySettingsResponse = await res.json();
      setChannelInfo(data);
      setEnabled(data.enabled ?? false);
      setSelectedCountries(data.countryCode ?? []);
    } catch (err) {
      toast("⚠️ 載入設定失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.channelId) {
      fetchSettings(user.channelId);
    }
  }, [user?.channelId]);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/my-settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: user?.channelId,
          enabled,
          countryCode: selectedCountries,
        }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error();
      showSuccessToast("設定已儲存");

      // ✅ 同步刷新 /api/my-settings/get 設定資料
      if (user?.channelId) {
        fetchSettings(user.channelId);
        queryClient.invalidateQueries({ queryKey: ["channel-info", user.channelId] });
      }
    } catch {
      showFailureToast("❌ 儲存失敗");
    }
  };

  return {
    enabled,
    setEnabled,
    selectedCountries,
    setSelectedCountries,
    loading,
    handleSave,
    channelInfo,
  };
}
