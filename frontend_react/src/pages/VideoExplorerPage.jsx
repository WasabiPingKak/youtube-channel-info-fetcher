import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useClassifiedVideos } from "../hooks/useClassifiedVideos";
import { useVideoBrowseState } from "../hooks/useVideoBrowseState";
import { useChartControlState } from "../hooks/useChartControlState";

import ChannelDrawer from "../components/common/ChannelDrawer";
import ChannelInfoCard from "../components/common/ChannelInfoCard";
import TopLevelTabs from "../components/common/TopLevelTabs";
import SubCategoryTabs from "../components/common/SubCategoryTabs";
import CategoryChartSection from "../components/chart/CategoryChartSection";
import VideoCard from "../components/common/VideoCard"
import MainLayout from "../components/layout/MainLayout";

// ✅ 若 URL 無指定 channel，使用預設頻道
const DEFAULT_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const VideoExplorerPage = () => {
  /* ---------------- 1. 解析 URL 參數 ---------------- */
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channel") || DEFAULT_CHANNEL_ID;

  /* ---------------- 2. 讀取影片與分類快取 ---------------- */
  const { videos, loading, error, categorySettings } = useClassifiedVideos(
    channelId,
    "videos"
  );

  /* ---------------- 3. 處理瀏覽狀態 ---------------- */
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

  /* ---------------- 4. 圖表控制 ---------------- */
  const {
    chartType,
    setChartType,
    durationUnit,
    setDurationUnit,
  } = useChartControlState();

  /* ---------------- 5. 切換頻道完成後關閉 Toast ---------------- */
  useEffect(() => {
    if (!loading) toast.dismiss("channel-switch");
  }, [loading]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handler = () => setDrawerOpen(true);
    window.addEventListener("open-channel-drawer", handler);
    return () => window.removeEventListener("open-channel-drawer", handler);
  }, []);

  /* ---------------- 6. 排序箭頭 ---------------- */
  const arrowOf = (field) => {
    if (field !== sortField) return null;
    return sortOrder === "asc" ? "🔼" : "🔽";
  };

  /* ---------------- 7. 主要畫面 ---------------- */
  return (
    <MainLayout>
      {/* 👉 ChannelDrawer & ChannelInfo */}
      <ChannelDrawer open={drawerOpen} setOpen={setDrawerOpen} showTriggerButton={false} />
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

      {/* 影片數量提示 */}
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
    </MainLayout>
  );
};

export default VideoExplorerPage;
