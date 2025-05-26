import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useClassifiedVideos } from "../hooks/useClassifiedVideos";
import { useVideoBrowseState } from "../hooks/useVideoBrowseState";
import { useChartControlState } from "../hooks/useChartControlState";
import useVideoSortControl from "../hooks/useVideoSortControl";

import ChannelInfoCard from "../components/common/ChannelInfoCard";
import TopLevelTabs from "../components/common/TopLevelTabs";
import SubCategoryTabs from "../components/common/SubCategoryTabs";
import CategoryChartSection from "../components/chart/CategoryChartSection";
import VideoCard from "../components/common/VideoCard"
import MainLayout from "../components/layout/MainLayout";
import VideoTableHeader from "../components/VideoExplorer/VideoTableHeader";
import MobileSortDropdown from "../components/VideoExplorer/MobileSortDropdown";

// ✅ 若 URL 無指定 channel，使用預設頻道
const DEFAULT_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const VideoExplorerPage = () => {

  const {
    sortField,
    sortOrder,
    handleSortChange,
  } = useVideoSortControl("publishDate");

  /* ---------------- 1. 解析 URL 參數 ---------------- */
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channel") || DEFAULT_CHANNEL_ID;

  /* ---------------- 2. 讀取影片與分類快取 ---------------- */
  const { videos, loading, error } = useClassifiedVideos(
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
    filteredVideos,
  } = useVideoBrowseState(videos);

  const sortedVideos = useMemo(() => {
    const list = [...filteredVideos];

    list.sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredVideos, sortField, sortOrder]);

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

  useEffect(() => {
    const runUpdateCheck = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/videos/check-update?channelId=${channelId}`
        );
        const data = await res.json();

        if (data.shouldUpdate && data.updateToken) {
          await fetch(`${import.meta.env.VITE_API_BASE}/api/videos/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId,
              updateToken: data.updateToken,
            }),
          });
        }
      } catch (e) {
        console.warn("🔁 頻道初始化自動更新失敗", e);
      }
    };

    runUpdateCheck();
  }, [channelId]);

  /* ---------------- 6. 排序箭頭 ---------------- */
  const arrowOf = (field) => {
    if (field !== sortField) return null;
    return sortOrder === "asc" ? "🔼" : "🔽";
  };

  /* ---------------- 7. 主要畫面 ---------------- */
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
