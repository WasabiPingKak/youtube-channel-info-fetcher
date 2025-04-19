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
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const VIDEO_TYPE_MAP = { live: "直播檔", videos: "影片", shorts: "Shorts" };
  const typeLabel = VIDEO_TYPE_MAP[videoType];

  // 統一處理主分類 or 細分類圖表資料
  const { countData, durationData } = useMemo(() => {
    const counts = {};

    videos.forEach((video) => {
      if (video.type !== typeLabel) return;

      const inCategory = video.matchedCategories?.includes(activeCategory);

      if (activeCategory) {
        const isGame = activeCategory === "遊戲";

        if (isGame && video.game) {
          const key = video.game;
          if (!counts[key]) counts[key] = { category: key, count: 0, duration: 0 };
          counts[key].count += 1;
          counts[key].duration += video.duration || 0;
        } else if (inCategory && Array.isArray(video.matchedKeywords)) {
          const keywords = categorySettings?.[videoType]?.[activeCategory] || [];
          video.matchedKeywords.forEach((kw) => {
            if (showAllKeywords || keywords.includes(kw)) {
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
        duration: Math.round((d.duration || 0) / 60),
      })),
    };
  }, [videos, typeLabel, activeCategory, categorySettings, videoType, showAllKeywords]);

  const sectionTitle = activeCategory
    ? `${activeCategory} 細分類圖表`
    : "主分類總覽圖表";

  const hasData = countData.length > 0 || durationData.length > 0;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">{sectionTitle}</h2>

      {/* 切換統計模式：雙文字顯示 toggle */}
      {activeCategory && activeCategory !== "遊戲" && (
        <div className="mb-2 text-sm">
          <button
            onClick={() => setShowAllKeywords(false)}
            className={`mr-4 font-medium transition ${!showAllKeywords ? "text-blue-600 underline" : "text-gray-400"}`}
          >
            只顯示分類設定中的關鍵字
          </button>
          <button
            onClick={() => setShowAllKeywords(true)}
            className={`font-medium transition ${showAllKeywords ? "text-blue-600 underline" : "text-gray-400"}`}
          >
            顯示分類內所有關鍵字
          </button>
        </div>
      )}

      {hasData ? (
        <>
          <ChartSwitcher chartType={chartType} setChartType={setChartType} />
          <CategoryChart
            countData={countData}
            durationData={durationData}
            chartType={chartType}
          />
        </>
      ) : (
        <p className="text-center text-gray-500 py-8">目前沒有資料可顯示</p>
      )}
    </div>
  );
};

export default CategoryChartSection;
