import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

import {
  useClassifiedVideos,
  useVideoBrowseState,
  useChartControlState,
  useAutoUpdateVideos,
} from "../hooks";

import {
  TopLevelTabs,
  SubCategoryTabs,
} from "../components/common";

import { VideoListSection } from "../components/VideoExplorer";

import CategoryChartSection from "../components/chart/CategoryChartSection";
import ContentExportCardSection from "../components/chart/ContentExportCardSection";

import MainLayout from "../components/layout/MainLayout";

const VideoExplorerContent = ({ channelId }: { channelId: string }) => {
  const { videos, loading, error } = useClassifiedVideos(channelId, "videos");

  const {
    videoType,
    setVideoType,
    activeCategory,
    setActiveCategory,
    sortField,
    sortOrder,
    handleSort,
    filteredVideos,
  } = useVideoBrowseState(videos);

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
      <ContentExportCardSection channelId={channelId} videos={videos} />

      <TopLevelTabs activeType={videoType} onTypeChange={(type: string) => setVideoType(type as "live" | "videos" | "shorts")} />
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

      <VideoListSection
        videos={filteredVideos}
        loading={loading}
        error={error}
        activeCategory={activeCategory}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        durationUnit={durationUnit}
      />
    </MainLayout>
  );
};

export default VideoExplorerContent;
