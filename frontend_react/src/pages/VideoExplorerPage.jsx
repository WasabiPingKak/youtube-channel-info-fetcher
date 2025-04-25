import React from "react";
import { useVideoCache } from "../hooks/useVideoCache";
import { useVideoBrowseState } from "../hooks/useVideoBrowseState";
import { useChartControlState } from "../hooks/useChartControlState";
import TopLevelTabs from "../components/common/TopLevelTabs";
import SubCategoryTabs from "../components/common/SubCategoryTabs";
import VideoCard from "../components/common/VideoCard";
import CategoryChartSection from "../components/chart/CategoryChartSection";
import ChannelInfoCard from "../components/common/ChannelInfoCard"; // ✅ 新增匯入

// ✅ 預設頻道 ID（之後可由側邊抽屜或 URL 參數帶入）
const DEFAULT_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const VideoExplorerPage = () => {
  // ✅ 改用新版 Hook：傳入頻道 ID 與 videoType
  const { videos, loading, error, categorySettings } = useVideoCache(
    DEFAULT_CHANNEL_ID,
    // videoType 由 useVideoBrowseState 控制，先給預設值，稍後再覆寫
    "videos"
  );

  const {
    SORT_FIELDS,
    videoType,
    setVideoType,
    activeCategory,
    setActiveCategory,
    sortField,
    sortOrder,
    handleSort,
    filteredVideos,
  } = useVideoBrowseState(videos, categorySettings);

  const {
    chartType,
    setChartType,
    durationUnit,
    setDurationUnit,
  } = useChartControlState();

  // ✨ 依 videoType 變化重新取資料（invalidateQueries）
  // （可選：若 useVideoBrowseState 已能在 setVideoType 觸發刷新，就不需要下面的 useEffect）
  // 這裡先示例基本用法，暫不加入

  const arrowOf = (field) => {
    if (field !== sortField) return null;
    return sortOrder === "asc" ? "🔼" : "🔽";
  };

  return (
    <div className="py-4">
      {/* ✅ 頻道資訊卡 */}
      <ChannelInfoCard />

      {/* Tabs */}
      <TopLevelTabs activeType={videoType} onTypeChange={setVideoType} />
      <SubCategoryTabs
        activeType={videoType}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        videos={videos}
      />

      {/* 圖表區 */}
      <CategoryChartSection
        videos={videos}
        videoType={videoType}
        chartType={chartType}
        setChartType={setChartType}
        durationUnit={durationUnit}
        setDurationUnit={setDurationUnit}
        activeCategory={activeCategory}
        categorySettings={categorySettings}
      />

      {/* 影片數量 */}
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

      {/* 影片列表 */}
      <div className="mt-2">
        {/* 表頭 */}
        <div className="flex px-4 py-2 text-xs text-gray-500 font-semibold border-b border-gray-200 select-none">
          <button
            type="button"
            onClick={() => handleSort(SORT_FIELDS.TITLE)}
            className="flex items-center gap-1 flex-1 min-w-[240px] max-w-[50%] cursor-pointer hover:text-gray-700"
          >
            標題 {arrowOf(SORT_FIELDS.TITLE)}
          </button>

          <button
            type="button"
            onClick={() => handleSort(SORT_FIELDS.PUBLISH_DATE)}
            className="flex items-center gap-1 basis-28 cursor-pointer hover:text-gray-700"
          >
            發布時間 {arrowOf(SORT_FIELDS.PUBLISH_DATE)}
          </button>

          <button
            type="button"
            onClick={() => handleSort(SORT_FIELDS.DURATION)}
            className="flex items-center gap-1 basis-28 cursor-pointer hover:text-gray-700"
          >
            時長 {arrowOf(SORT_FIELDS.DURATION)}
          </button>

          <button
            type="button"
            onClick={() => handleSort(SORT_FIELDS.GAME)}
            className="flex items-center gap-1 basis-28 cursor-pointer hover:text-gray-700"
          >
            遊戲 {arrowOf(SORT_FIELDS.GAME)}
          </button>

          <button
            type="button"
            onClick={() => handleSort(SORT_FIELDS.KEYWORDS)}
            className="flex items-center gap-1 basis-40 cursor-pointer hover:text-gray-700"
          >
            關鍵字 {arrowOf(SORT_FIELDS.KEYWORDS)}
          </button>

          <div className="w-1/12 text-right">連結</div>
        </div>

        {/* 資料列 */}
        {filteredVideos.map((video) => (
          <VideoCard
            key={video.videoId}
            video={video}
            durationUnit={durationUnit}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoExplorerPage;
