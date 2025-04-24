import React, { useEffect, useMemo, useState } from "react";
import { useVideoCache } from "../hooks/useVideoCache";
import TopLevelTabs from "../components/common/TopLevelTabs";
import SubCategoryTabs from "../components/common/SubCategoryTabs";
import VideoCard from "../components/common/VideoCard";
import CategoryChartSection from "../components/chart/CategoryChartSection";

// 排序欄位常數
const SORT_FIELDS = {
  TITLE: "title",
  PUBLISH_DATE: "publishDate",
  DURATION: "duration",
  GAME: "game",
  KEYWORDS: "keywords",
};

const VideoExplorerPage = () => {
  // Tabs & 顯示狀態
  const [videoType, setVideoType] = useState("live"); // "live" | "videos" | "shorts"
  const [activeCategory, setActiveCategory] = useState("全部");
  const [chartType, setChartType] = useState("pie");
  const [durationUnit, setDurationUnit] = useState("hours"); // "minutes" | "hours"

  // 排序狀態
  const [sortField, setSortField] = useState(SORT_FIELDS.PUBLISH_DATE); // 預設按發布時間
  const [sortOrder, setSortOrder] = useState("desc"); // 預設新→舊 (🔽)

  const { videos, loading, error, categorySettings } = useVideoCache();

  /* --------------------------- 分類與排序 --------------------------- */
  const VIDEO_TYPE_MAP = {
    live: "直播檔",
    videos: "影片",
    shorts: "Shorts",
  };

  const filteredVideos = useMemo(() => {
    const expectedType = VIDEO_TYPE_MAP[videoType];

    // 1. 過濾 by 影片類型與主/次分類
    const base = videos.filter((video) => {
      const matchesType = video.type === expectedType;
      if (activeCategory === "全部") return matchesType;
      const matchesCategory =
        activeCategory && video.matchedCategories?.includes(activeCategory);
      return matchesType && matchesCategory;
    });

    // 2. 排序
    const direction = sortOrder === "asc" ? 1 : -1;

    const getVal = (video, field) => {
      switch (field) {
        case SORT_FIELDS.TITLE:
          return video.title;
        case SORT_FIELDS.PUBLISH_DATE:
          return video.publishDate;
        case SORT_FIELDS.DURATION:
          return video.duration; // 秒數
        case SORT_FIELDS.GAME:
          return video.game || "-";
        case SORT_FIELDS.KEYWORDS:
          return video.matchedKeywords?.length > 0
            ? video.matchedKeywords.join(", ")
            : "-";
        default:
          return "";
      }
    };

    const sorted = [...base].sort((a, b) => {
      const valA = getVal(a, sortField);
      const valB = getVal(b, sortField);

      // 日期 / 數值
      if (sortField === SORT_FIELDS.PUBLISH_DATE) {
        return (new Date(valA) - new Date(valB)) * direction;
      }
      if (sortField === SORT_FIELDS.DURATION) {
        return (valA - valB) * direction;
      }

      // 文字，處理 "-" 排序
      const isMissingA = valA === "-";
      const isMissingB = valB === "-";
      if (isMissingA && isMissingB) return 0;
      if (isMissingA) return sortOrder === "asc" ? 1 : -1;
      if (isMissingB) return sortOrder === "asc" ? -1 : 1;

      return valA.localeCompare(valB, "zh-Hant-u-co-stroke") * direction;
    });

    return sorted;
  }, [videos, videoType, activeCategory, sortField, sortOrder]);

  /* ----------------------------- 操作 ----------------------------- */
  const handleSort = (field) => {
    if (field === sortField) {
      // 同欄 -> 反轉
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // 切欄位 -> 重設方向 (發布時間預設 desc，其餘 asc)
      setSortField(field);
      setSortOrder(field === SORT_FIELDS.PUBLISH_DATE ? "desc" : "asc");
    }
  };

  // 切換影片類型 -> 回到 "全部" 分類
  useEffect(() => {
    setActiveCategory("全部");
  }, [videoType]);

  /* ------------------------------ UI ------------------------------ */
  const arrowOf = (field) => {
    if (field !== sortField) return null;
    return sortOrder === "asc" ? "🔼" : "🔽";
  };

  return (
    <div className="py-4">
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
        {activeCategory ? `共顯示 ${filteredVideos.length} 部影片` : "請選擇分類"}
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
          <VideoCard key={video.videoId} video={video} durationUnit={durationUnit} />
        ))}
      </div>
    </div>
  );
};

export default VideoExplorerPage;
