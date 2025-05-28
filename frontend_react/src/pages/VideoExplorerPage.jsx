import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { useChannelInfo } from "@/hooks/useChannelInfo";
import { useMyChannelId } from "@/hooks/useMyChannelId";

// ✅ 若 URL 無指定 channel，使用開發者預設頻道
const ADMIN_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const VideoExplorerPage = () => {
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channel") || ADMIN_CHANNEL_ID;

  // 🔒 讀取目前登入者的頻道 ID
  const { data: me, isLoading: meLoading, error: meError } = useMyChannelId();

  // 🔒 取得該頻道的公開資訊
  const { data: channelInfo, isLoading: infoLoading } = useChannelInfo(channelId);

  const navigate = useNavigate();

  // 🔒 權限檢查：頻道不公開且非本人 → 導回首頁
  useEffect(() => {
    const myId = me?.channelId;
    const targetId = channelInfo?.channel_id;

    console.log("📌 [權限檢查] me =", myId);
    console.log("📌 [權限檢查] channel =", targetId, "| enabled =", channelInfo?.enabled);

    if (
      !meLoading &&
      !infoLoading &&
      channelInfo?.enabled === false &&
      (!me || meError || me.channelId !== channelId)
    ) {
      // 非公開且非本人 → 禁止進入
      toast.error("您沒有權限查看這個頻道頁面");
      navigate("/");
    }

  }, [meLoading, infoLoading, me, meError, channelInfo, navigate]);

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

  // 🔒 避免權限未判斷完成就顯示資料
  if (infoLoading || !channelInfo) {
    return (
      <MainLayout>
        <div className="px-4 py-10 text-center text-gray-500">載入中...</div>
      </MainLayout>
    );
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
        onToggleOrder={() =>
          handleSortChange(sortField)
        }
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

export default VideoExplorerPage;
