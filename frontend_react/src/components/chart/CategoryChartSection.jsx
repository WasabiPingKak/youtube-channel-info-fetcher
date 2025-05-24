import React, { useMemo, useState } from "react";
import CategoryChart from "./CategoryChart";
import ChartSwitcher from "./ChartSwitcher";

const CategoryChartSection = ({
  videos,
  videoType,
  chartType,
  setChartType,
  durationUnit,
  setDurationUnit,
  activeCategory,
  categorySettings,
}) => {
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const VIDEO_TYPE_MAP = { live: "直播檔", videos: "影片", shorts: "Shorts" };
  const typeLabel = VIDEO_TYPE_MAP[videoType];

  // 🎯 用於傳入 Chart 作為去重複加總基礎資料
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      if (video.type !== typeLabel) return false;

      if (activeCategory === "全部") return true;

      if (activeCategory === "遊戲") return Boolean(video.game);

      return video.matchedCategories?.includes(activeCategory);
    });
  }, [videos, typeLabel, activeCategory]);

  // 統計圖表資料：分類數與總時長（秒）
  const { countData, durationData } = useMemo(() => {
    const counts = {};

    videos.forEach((video) => {
      if (video.type !== typeLabel) return;

      const inCategory = video.matchedCategories?.includes(activeCategory);

      if (activeCategory && activeCategory !== "全部") {
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
        // 主分類統計邏輯，包括 activeCategory === "全部"
        if (Array.isArray(video.matchedCategories)) {
          video.matchedCategories.forEach((cat) => {
            if (!counts[cat]) counts[cat] = { category: cat, count: 0, duration: 0 };
            counts[cat].count += 1;
            counts[cat].duration += video.duration || 0;
          });
        }
      }
    });

    const sorted = Object.values(counts).sort((a, b) => {
      if (a.category === "其他") return 1;
      if (b.category === "其他") return -1;
      return b.count - a.count;
    });

    return {
      countData: sorted.map((d) => ({ category: d.category, count: d.count })),
      durationData: sorted.map((d) => ({
        category: d.category,
        duration: d.duration || 0,
      })),
    };
  }, [videos, typeLabel, activeCategory, categorySettings, videoType, showAllKeywords]);

  const sectionTitle =
    activeCategory && activeCategory !== "遊戲"
      ? `${activeCategory} 細分類圖表`
      : "主分類總覽圖表";

  const hasData = countData.length > 0 || durationData.length > 0;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">
        {activeCategory === "全部" ? "全部 細分類圖表" : sectionTitle}
      </h2>

      {activeCategory && activeCategory !== "遊戲" && activeCategory !== "全部" && (
        <div className="mb-3 mx-4">
          <div className="inline-flex rounded border p-1 bg-gray-100 text-sm font-medium">
            <button
              onClick={() => setShowAllKeywords(false)}
              className={`px-3 py-1 rounded transition ${
                !showAllKeywords
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-700 hover:bg-white"
              }`}
            >
              主分類
            </button>
            <button
              onClick={() => setShowAllKeywords(true)}
              className={`px-3 py-1 rounded transition ${
                showAllKeywords
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-700 hover:bg-white"
              }`}
            >
              顯示所有交叉命中關鍵字
            </button>
          </div>
        </div>
      )}

      {hasData ? (
        <>
          <ChartSwitcher
            chartType={chartType}
            setChartType={setChartType}
            durationUnit={durationUnit}
            setDurationUnit={setDurationUnit}
          />
          <CategoryChart
            countData={countData}
            durationData={durationData}
            chartType={chartType}
            durationUnit={durationUnit}
            videos={filteredVideos}
          />
        </>
      ) : (
        <p className="text-center text-gray-500 py-8">目前沒有資料可顯示</p>
      )}
    </div>
  );
};

export default CategoryChartSection;
