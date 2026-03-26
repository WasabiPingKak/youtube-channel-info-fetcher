import { useQuery } from "@tanstack/react-query";
import type { ActiveTimeResponse } from "@/types/activeTime";

export type { ActiveTimeMatrix, ActiveTimeChannel, ActiveTimeResponse } from "@/types/activeTime";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const fetchActiveTimeChannels = async (): Promise<ActiveTimeResponse> => {
  const res = await fetch(`${API_BASE}/api/heatmap/weekly`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`取得快取資料失敗：${res.status}`);
  }

  return res.json();
};

export function useActiveTimeChannels() {
  return useQuery({
    queryKey: ["active-time-channels"],
    queryFn: fetchActiveTimeChannels,
    // gcTime: 5 * 60 * 1000, // 保留 5 分鐘
  });
}
