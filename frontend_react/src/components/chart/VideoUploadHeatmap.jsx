import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import HeatmapContainer from "./HeatmapContainer";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const fetchHeatmapData = async (channelId) => {
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

const VideoUploadHeatmap = ({ videos }) => {
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channel");

  const [hoverInfo, setHoverInfo] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["upload-heatmap", channelId],
    queryFn: () => fetchHeatmapData(channelId),
    enabled: !!channelId,
  });

  const maxCount = useMemo(() => {
    if (!data?.matrix) return 1;
    return Math.max(
      ...Object.values(data.matrix).flatMap((hourMap) =>
        Object.values(hourMap).map((arr) => arr.length)
      )
    );
  }, [data]);

  if (!channelId) {
    return (
      <div className="px-4 py-4 text-red-500">
        未提供 channel 參數，無法載入活躍時段資料。
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-4">
        <div
          className="bg-gray-100 border border-gray-200 shadow p-4 animate-pulse"
          style={{ height: 600 }}
        >
          <div className="text-sm text-gray-400">載入中…</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-4 text-red-500">
        無法載入「上片活躍時段」資料
      </div>
    );
  }

  return (
    <div className="py-4">
      <HeatmapContainer
        data={data}
        maxCount={maxCount}
        hoverInfo={hoverInfo}
        setHoverInfo={setHoverInfo}
        videos={videos}
      />
    </div>
  );
};

export default VideoUploadHeatmap;
