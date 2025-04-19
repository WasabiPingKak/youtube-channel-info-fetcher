import React, { useEffect, useState } from "react";
import { useVideoCache } from "../hooks/useVideoCache";
import TopLevelTabs from "../components/common/TopLevelTabs";
import SubCategoryTabs from "../components/common/SubCategoryTabs";
import VideoCard from "../components/common/VideoCard";
import CategoryChartSection from "../components/chart/CategoryChartSection";

const VideoExplorerPage = () => {
  const [videoType, setVideoType] = useState("videos"); // "live" | "videos" | "shorts"
  const [activeCategory, setActiveCategory] = useState(null);
  const [chartType, setChartType] = useState("pie");
  const { videos, loading, error, categorySettings } = useVideoCache();

  // 自動選第一個分類（初次載入 or 類型切換）
  useEffect(() => {
    setActiveCategory(null); // 清空分類讓 SubCategoryTabs 主動設為第一個分類
  }, [videoType]);

  const VIDEO_TYPE_MAP = { live: "直播檔", videos: "影片", shorts: "Shorts" };

  const filteredVideos = videos.filter((video) => {
    const expectedType = VIDEO_TYPE_MAP[videoType];
    const matchesType = video.type === expectedType;
    const matchesCategory = activeCategory && video.matchedCategories?.includes(activeCategory);
    return matchesType && matchesCategory;
  });

  return (
    <div className="py-4">
      <TopLevelTabs activeType={videoType} onTypeChange={setVideoType} />
      <SubCategoryTabs
        activeType={videoType}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <CategoryChartSection
        videos={videos}
        videoType={videoType}
        chartType={chartType}
        setChartType={setChartType}
        activeCategory={activeCategory}
        categorySettings={categorySettings}
      />

      <div className="px-4 py-2 text-sm text-gray-600">
        {activeCategory
          ? `共顯示 ${filteredVideos.length} 部影片`
          : "請選擇分類"}
      </div>

      {loading && <p className="px-4">載入中...</p>}
      {error && <p className="px-4 text-red-600">錯誤：{error.message}</p>}

      {!loading && !error && filteredVideos.length === 0 && activeCategory && (
        <p className="px-4 text-gray-500">目前無影片</p>
      )}

      <div className="mt-2">
        <div className="flex px-4 py-2 text-xs text-gray-500 font-semibold border-b border-gray-200">
          <div className="w-1/4">標題</div>
          <div className="w-1/6">發布時間</div>
          <div className="w-1/6">時長</div>
          <div className="w-1/6">遊戲</div>
          <div className="w-1/6">關鍵字</div>
          <div className="w-1/12 text-right">連結</div>
        </div>
        {filteredVideos.map((video) => (
          <VideoCard key={video.videoId} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoExplorerPage;