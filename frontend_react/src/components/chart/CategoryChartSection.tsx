import React, { useMemo, useState } from "react";
import CategoryChart from "./CategoryChart";
import ChartSwitcher from "./ChartSwitcher";
import type { ClassifiedVideoItem } from "@/types/category";
import {
  CHART_TYPE_MAP,
  filterChartVideos,
  aggregateVideoMetrics,
} from "@/utils/chartDataUtils";

interface CategoryChartSectionProps {
  videos: ClassifiedVideoItem[];
  videoType: "live" | "videos" | "shorts";
  chartType: "pie" | "bar";
  setChartType: (type: "pie" | "bar") => void;
  durationUnit: "minutes" | "hours";
  setDurationUnit: (unit: "minutes" | "hours") => void;
  activeCategory: string;
}

const CategoryChartSection = ({
  videos,
  videoType,
  chartType,
  setChartType,
  durationUnit,
  setDurationUnit,
  activeCategory,
}: CategoryChartSectionProps) => {
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const typeLabel = CHART_TYPE_MAP[videoType];

  const filteredVideos = useMemo(
    () => filterChartVideos(videos, typeLabel, activeCategory),
    [videos, typeLabel, activeCategory],
  );

  const { countData, durationData } = useMemo(
    () => aggregateVideoMetrics(videos, typeLabel, activeCategory, showAllKeywords),
    [videos, typeLabel, activeCategory, showAllKeywords],
  );

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
