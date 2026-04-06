import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

import { useClassifiedVideos, useAutoUpdateVideos } from "../hooks";
import type { VideoType } from "../utils/filterClassifiedVideos";

import MainLayout from "../components/layout/MainLayout";
import ChannelInfoCard from "../components/common/ChannelInfoCard";
import ChannelPageTabs from "../components/channel/ChannelPageTabs";
import type { ChannelTab } from "../components/channel/ChannelPageTabs";
import OverviewSection from "../components/channel/OverviewSection";
import VideoSection from "../components/channel/VideoSection";
import HeatmapSection from "../components/channel/HeatmapSection";

const VideoExplorerContent = ({ channelId }: { channelId: string }) => {
  const { videos, loading, error } = useClassifiedVideos(channelId, "videos");

  const [activeTab, setActiveTab] = useState<ChannelTab>("overview");
  const [videoType, setVideoType] = useState<VideoType>("live");
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  useAutoUpdateVideos(channelId);

  // 圖表 → 影片 tab 聯動
  const handleCategoryClick = useCallback((category: string) => {
    setPendingCategory(category);
    setActiveTab("videos");
  }, []);

  // 切到影片 tab 後清除 pending
  useEffect(() => {
    if (activeTab !== "videos") {
      setPendingCategory(null);
    }
  }, [activeTab]);

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
      <ChannelInfoCard channelId={channelId} />
      <ChannelPageTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewSection
          videos={videos}
          videoType={videoType}
          setVideoType={setVideoType}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {activeTab === "videos" && (
        <VideoSection
          videos={videos}
          loading={loading}
          error={error}
          initialCategory={pendingCategory}
        />
      )}

      {activeTab === "heatmap" && (
        <HeatmapSection
          channelId={channelId}
          videos={videos}
        />
      )}
    </MainLayout>
  );
};

export default VideoExplorerContent;
