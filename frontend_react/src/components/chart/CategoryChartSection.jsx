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
}) => {
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const VIDEO_TYPE_MAP = { live: "直播檔", videos: "影片", shorts: "Shorts" };
  const typeLabel = VIDEO_TYPE_MAP[videoType];

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      if (video.type !== typeLabel) return false;
      if (activeCategory === "全部") return true;
      if (activeCategory === "遊戲") return Boolean(video.game);
      return video.matchedCategories?.includes(activeCategory);
    });
  }, [videos, typeLabel, activeCategory]);

  const { countData, durationData } = useMemo(() => {
    const counts = {};
    videos.forEach((video) => {
      if (video.type !== typeLabel) return;

      const isGame = activeCategory === "遊戲";
      const isAll = activeCategory === "全部";
      const isSpecific = !isGame && !isAll;

      if (isGame && video.game) {
        const key = video.game;
        if (!counts[key]) counts[key] = { category: key, count: 0, duration: 0 };
        counts[key].count += 1;
        counts[key].duration += video.duration || 0;
      } else if (isSpecific && Array.isArray(video.matchedPairs)) {
        const seen = new Set();
        video.matchedPairs.forEach(({ keyword, main }) => {
          if (main !== activeCategory) return;
          if (!showAllKeywords && seen.has(keyword)) return;
          seen.add(keyword);
          if (!counts[keyword]) counts[keyword] = { category: keyword, count: 0, duration: 0 };
          counts[keyword].count += 1;
          counts[keyword].duration += video.duration || 0;
        });
      } else if (isAll && Array.isArray(video.matchedCategories)) {
        video.matchedCategories.forEach((cat) => {
          if (!counts[cat]) counts[cat] = { category: cat, count: 0, duration: 0 };
          counts[cat].count += 1;
          counts[cat].duration += video.duration || 0;
        });
      }
    });

    const sorted = Object.values(counts).sort((a, b) => {
      if (a.category === "未分類") return 1;
      if (b.category === "未分類") return -1;
      return b.count - a.count;
    });

    return {
      countData: sorted.map((d) => ({ category: d.category, count: d.count })),
      durationData: sorted.map((d) => ({
        category: d.category,
        duration: d.duration || 0,
      })),
    };
  }, [videos, typeLabel, activeCategory, showAllKeywords]);

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
          <div className="inline-flex rounded border p-1 bg-gray-100 dark:bg-zinc-700 text-sm font-medium">
            <button
              onClick={() => setShowAllKeywords(false)}
              className={`px-3 py-1 rounded transition ${!showAllKeywords
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-700 dark:text-gray-100 hover:bg-white dark:hover:bg-zinc-800"
                }`}
            >
              主分類
            </button>
            <button
              onClick={() => setShowAllKeywords(true)}
              className={`px-3 py-1 rounded transition ${showAllKeywords
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-700 dark:text-gray-100 hover:bg-white dark:hover:bg-zinc-800"
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
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          目前沒有資料可顯示
        </p>
      )}
    </div>
  );
};

export default CategoryChartSection;
