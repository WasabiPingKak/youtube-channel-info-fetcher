import React, { useMemo } from "react";
import ChartWithLegend from "./ChartWithLegend";
import ChartTypeBar from "./ChartTypeBar";
import type { ClassifiedVideoItem } from "@/types/category";

interface CategoryChartProps {
  countData: { category: string; count: number }[];
  durationData: { category: string; duration: number }[];
  chartType: "pie" | "bar";
  durationUnit: "minutes" | "hours";
  videos?: ClassifiedVideoItem[];
}

/**
 * CategoryChart
 * 根據 chartType 與 durationUnit 切換 Pie/Bar 圖表組合
 */
const CategoryChart = ({
  countData,
  durationData,
  chartType,
  durationUnit,
  videos = [],
}: CategoryChartProps) => {
  const convertedDurationData = useMemo(() => {
    return durationData.map((d: { category: string; duration: number }) => {
      const secs = d.duration || 0;
      const value =
        durationUnit === "hours"
          ? +(secs / 3600).toFixed(1)
          : Math.round(secs / 60);
      return { ...d, duration: value };
    });
  }, [durationData, durationUnit]);

  const durationUnitLabel = durationUnit === "hours" ? "小時" : "分鐘";

  if (chartType === "bar") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h3 className="text-base font-semibold mb-4 dark:text-gray-100">分類次數統計圖</h3>
          <ChartTypeBar data={countData} dataKey="count" />
        </div>
        <div>
          <h3 className="text-base font-semibold mb-4 dark:text-gray-100">
            分類總時長統計圖（{durationUnitLabel}）
          </h3>
          <ChartTypeBar data={convertedDurationData} dataKey="duration" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
      <div>
        <h3 className="text-base font-semibold mb-4 dark:text-gray-100">分類次數統計圖</h3>
        <ChartWithLegend
          data={countData}
          dataKey="count"
          unit="部"
          videos={videos}
        />
      </div>
      <div>
        <h3 className="text-base font-semibold mb-4 dark:text-gray-100">
          分類總時長統計圖（{durationUnitLabel}）
        </h3>
        <ChartWithLegend
          data={convertedDurationData}
          dataKey="duration"
          unit={durationUnitLabel}
          videos={videos}
        />
      </div>
    </div>
  );
};

export default CategoryChart;
