import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeatmapContainer from "./HeatmapContainer";
import type { ClassifiedVideoItem } from "@/types/category";

import { API_BASE } from "@/lib/api";

interface HeatmapResponse {
  matrix?: Record<string, Record<string, string[]>>;
}

const fetchHeatmapData = async (channelId: string): Promise<HeatmapResponse> => {
  const url = `${API_BASE}/api/heatmap/${channelId}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`取得 heatmap 失敗：${res.status}`);
  }

  return res.json();
};

interface VideoUploadHeatmapProps {
  channelId: string;
  videos: ClassifiedVideoItem[];
}

const VideoUploadHeatmap = ({ channelId, videos }: VideoUploadHeatmapProps) => {

  const [hoverInfo, setHoverInfo] = useState<{ label: string; hour: number; videoIds: string[]; count: number } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["upload-heatmap", channelId],
    queryFn: () => fetchHeatmapData(channelId),
  });

  const maxCount = useMemo(() => {
    if (!data?.matrix) return 1;
    return Math.max(
      ...Object.values(data.matrix).flatMap((hourMap: Record<string, string[]>) =>
        Object.values(hourMap).map((arr: string[]) => arr.length)
      )
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4 animate-pulse"
        style={{ height: 520 }}
      >
        <div className="text-sm text-gray-400 dark:text-gray-500">載入中…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400 py-4">
        無法載入「上片活躍時段」資料
      </div>
    );
  }

  return (
    <div className="py-4">
      <HeatmapContainer
        data={data!}
        maxCount={maxCount}
        hoverInfo={hoverInfo}
        setHoverInfo={setHoverInfo}
        videos={videos}
      />
    </div>
  );
};

export default VideoUploadHeatmap;
