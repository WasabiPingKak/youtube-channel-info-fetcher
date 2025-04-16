import React, { useEffect, useState } from "react";
import { useVideoCache } from "../hooks/useVideoCache";
import TopLevelTabs from "../components/common/TopLevelTabs";
import SubCategoryTabs from "../components/common/SubCategoryTabs";
import VideoCard from "../components/common/VideoCard";

const VideoExplorerPage = () => {
  const [videoType, setVideoType] = useState("videos"); // "live" | "videos" | "shorts"
  const [activeCategory, setActiveCategory] = useState(null);
  const { videos, loading, error } = useVideoCache();

  // 自動選第一個分類（初次載入 or 類型切換）
  useEffect(() => {
    setActiveCategory(null); // 清空分類讓 SubCategoryTabs 主動設為第一個分類
  }, [videoType]);

  const filteredVideos = videos.filter((video) => {
    if (!activeCategory) return false;
    return video.matchedCategories?.includes(activeCategory);
  });

  return (
    <div className="py-4">
      <TopLevelTabs activeType={videoType} onTypeChange={setVideoType} />
      <SubCategoryTabs
        activeType={videoType}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
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
        {filteredVideos.map((video) => (
          <VideoCard key={video.videoId} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoExplorerPage;
