import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  useClassifiedVideos, useVideoBrowseState, useChartControlState,
  useAutoUpdateVideos, useVideoSortControl,
} from "../hooks";

import {
  ChannelInfoCard, TopLevelTabs, SubCategoryTabs, VideoCard
} from "../components/common";

import {
  VideoTableHeader, MobileSortDropdown,
} from "../components/VideoExplorer";

import { sortVideos } from "../utils/sortVideos";
import CategoryChartSection from "../components/chart/CategoryChartSection";
import MainLayout from "../components/layout/MainLayout";

// ✅ 若 URL 無指定 channel，使用預設頻道
const ADMIN_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const VideoExplorerPage = () => {

  const {
    sortField,
    sortOrder,
    handleSortChange,
  } = useVideoSortControl("publishDate");

  /* ---------------- 解析 URL 參數 ---------------- */
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channel") || ADMIN_CHANNEL_ID;

  /* ---------------- 讀取影片與分類快取 ---------------- */
  const { videos, loading, error } = useClassifiedVideos(
    channelId,
    "videos"
  );

  /* ---------------- 處理瀏覽狀態 ---------------- */
  const {
    SORT_FIELDS,
    videoType,
    setVideoType,
    activeCategory,
    setActiveCategory,
    filteredVideos,
  } = useVideoBrowseState(videos);

  const sortedVideos = useMemo(
    () => sortVideos(filteredVideos, sortField, sortOrder),
    [filteredVideos, sortField, sortOrder]
  );

  /* ---------------- 圖表控制 ---------------- */
  const {
    chartType,
    setChartType,
    durationUnit,
    setDurationUnit,
  } = useChartControlState();

  /* ---------------- 切換頻道完成後關閉 Toast ---------------- */
  useEffect(() => {
    if (!loading) toast.dismiss("channel-switch");
  }, [loading]);

  const [setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setDrawerOpen(true);
    window.addEventListener("open-channel-drawer", handler);
    return () => window.removeEventListener("open-channel-drawer", handler);
  }, []);

  useAutoUpdateVideos(channelId);

  /* ---------------- 主要畫面 ---------------- */
  return (
    <MainLayout>
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
      <VideoTableHeader
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <MobileSortDropdown
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onToggleOrder={() =>
          handleSortChange(sortField) // 再次點擊同欄位會切換升降序
        }
      />

      {/* 資料列 */}
      {sortedVideos.map((video) => (
        <VideoCard
          key={video.videoId}
          video={video}
          durationUnit={durationUnit}
        />
      ))}
    </MainLayout>
  );
};

export default VideoExplorerPage;
