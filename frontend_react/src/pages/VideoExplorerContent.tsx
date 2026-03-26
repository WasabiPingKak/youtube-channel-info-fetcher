import React, { useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";

import {
  useClassifiedVideos,
  useVideoBrowseState,
  useChartControlState,
  useAutoUpdateVideos,
  useVideoSortControl,
} from "../hooks";

import {
  TopLevelTabs,
  SubCategoryTabs,
  VideoCard,
} from "../components/common";

import {
  VideoTableHeader,
  MobileSortDropdown,
} from "../components/VideoExplorer";

import { sortVideos } from "../utils/sortVideos";
import CategoryChartSection from "../components/chart/CategoryChartSection";
import ContentExportCardSection from "../components/chart/ContentExportCardSection";

import MainLayout from "../components/layout/MainLayout";

const VideoExplorerContent = ({ channelId }) => {
  const {
    sortField,
    sortOrder,
    handleSortChange,
  } = useVideoSortControl("publishDate");

  const { videos, loading, error } = useClassifiedVideos(channelId, "videos");

  const {
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

  const {
    chartType,
    setChartType,
    durationUnit,
    setDurationUnit,
  } = useChartControlState();

  useAutoUpdateVideos(channelId);

  useEffect(() => {
    if (loading && !videos.length) {
      toast.dismiss();
      toast.loading("影片資料載入中...", { id: "loading-videos" });
    } else {
      toast.dismiss("loading-videos");
    }
  }, [loading, videos.length]);

  if (loading && !videos.length) {
    return (
      <MainLayout>
        <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
          影片資料載入中...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ContentExportCardSection videos={videos} />

      <TopLevelTabs activeType={videoType} onTypeChange={setVideoType} />
      <SubCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <CategoryChartSection
        videos={videos}
        videoType={videoType}
        chartType={chartType}
        setChartType={setChartType}
        durationUnit={durationUnit}
        setDurationUnit={setDurationUnit}
        activeCategory={activeCategory}
      />

      <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
        {activeCategory
          ? `共顯示 ${filteredVideos.length} 部影片`
          : "請選擇分類"}
      </div>

      {loading && (
        <p className="px-4 text-gray-500 dark:text-gray-300">載入中...</p>
      )}
      {error && (
        <p className="px-4 text-red-600 dark:text-red-400">
          錯誤：{error.message}
        </p>
      )}
      {!loading && !error && filteredVideos.length === 0 && activeCategory && (
        <p className="px-4 text-gray-500 dark:text-gray-400">
          目前無影片。若是剛連結頻道的新用戶，資料庫初始化可能需等待數十分鐘。<br />
          若連結已超過一天仍無任何資料，請聯絡管理者協助處理。
        </p>
      )}

      <VideoTableHeader
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <MobileSortDropdown
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onToggleOrder={() => handleSortChange(sortField)}
      />

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

export default VideoExplorerContent;
