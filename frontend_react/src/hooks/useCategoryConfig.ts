import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE || "";

const getCategoryConfig = async (channelId: string) => {
  const res = await fetch(`${API_BASE}/api/firestore/load-category-settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel_id: channelId, init_default: true }),
  });

  if (!res.ok) {
    throw new Error(`HTTP 錯誤：${res.status}`);
  }

  const result = await res.json();
  if (result.success && result.settings) {
    return result.settings;
  }

  throw new Error(result.error || "無法載入分類設定");
};

export const useCategoryConfig = (channelId: string) => {
  const queryResult = useQuery({
    queryKey: ['category-config', channelId],
    queryFn: () => getCategoryConfig(channelId),
    enabled: !!channelId,
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    refetch: queryResult.refetch,
  };
};
