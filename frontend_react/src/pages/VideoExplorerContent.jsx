import React, { useMemo } from "react";
import { toast } from "react-hot-toast";

import {
  useClassifiedVideos,
  useVideoBrowseState,
  useChartControlState,
  useAutoUpdateVideos,
  useVideoSortControl,
} from "../hooks";

import {
  ChannelInfoCard,
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
import MainLayout from "../components/layout/MainLayout";

const VideoExplorerContent = ({ channelId }) => {

  const {
    sortField,
    sortOrder,
    handleSortChange,
  } = useVideoSortControl("publishDate");

  const { videos, loading, error } = useClassifiedVideos(
    channelId,
    "videos"
  );

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

  if (loading) {
    toast.dismiss("channel-switch");
  }

  return (
    <MainLayout>
      <ChannelInfoCard />

      <TopLevelTabs activeType={videoType} onTypeChange={setVideoType} />
      <SubCategoryTabs
        activeType={videoType}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        videos={videos}
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
