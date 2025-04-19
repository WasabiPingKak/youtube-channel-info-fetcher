import React, { useMemo, useState } from "react";
import CategoryChart from "./CategoryChart";
import ChartSwitcher from "./ChartSwitcher";

const CategoryChartSection = ({
  videos,
  videoType,
  chartType,
  setChartType,
  activeCategory,
  categorySettings,
}) => {
  const VIDEO_TYPE_MAP = { live: "直播檔", videos: "影片", shorts: "Shorts" };
  const typeLabel = VIDEO_TYPE_MAP[videoType];

  // 統一處理主分類 or 細分類圖表資料
  const { countData, durationData } = useMemo(() => {
    const counts = {};

    videos.forEach((video) => {
      if (video.type !== typeLabel) return;

      // 細分類統計邏輯
      if (activeCategory) {
        const isGame = activeCategory === "遊戲";

        if (isGame && video.game) {
          const key = video.game;
          if (!counts[key]) counts[key] = { category: key, count: 0, duration: 0 };
          counts[key].count += 1;
          counts[key].duration += video.duration || 0;
        } else if (Array.isArray(video.matchedKeywords)) {
          const keywords = categorySettings?.[videoType]?.[activeCategory] || [];
          video.matchedKeywords.forEach((kw) => {
            if (keywords.includes(kw)) {
              if (!counts[kw]) counts[kw] = { category: kw, count: 0, duration: 0 };
              counts[kw].count += 1;
              counts[kw].duration += video.duration || 0;
            }
          });
        }
      } else {
        // 主分類統計邏輯
        if (Array.isArray(video.matchedCategories)) {
          video.matchedCategories.forEach((cat) => {
            if (!counts[cat]) counts[cat] = { category: cat, count: 0, duration: 0 };
            counts[cat].count += 1;
            counts[cat].duration += video.duration || 0;
          });
        }
      }
    });

    // 排序：先多到少，"其他" 永遠放最後
    const sorted = Object.values(counts).sort((a, b) => {
      if (a.category === "其他") return 1;
      if (b.category === "其他") return -1;
      return b.count - a.count;
    });

    return {
      countData: sorted.map((d) => ({ category: d.category, count: d.count })),
      durationData: sorted.map((d) => ({
        category: d.category,
        duration: Math.round((d.duration || 0) / 60), // 秒數轉分鐘
      })),
    };
  }, [videos, typeLabel, activeCategory, categorySettings, videoType]);

  const sectionTitle = activeCategory
    ? `${activeCategory} 細分類圖表`
    : "主分類總覽圖表";

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">{sectionTitle}</h2>
      <ChartSwitcher chartType={chartType} setChartType={setChartType} />
      <CategoryChart
        countData={countData}
        durationData={durationData}
        chartType={chartType}
      />
    </div>
  );
};

export default CategoryChartSection;
