import React, { useMemo } from "react";
import ChartWithLegend from "./ChartWithLegend";
import ChartTypeBar from "./ChartTypeBar";

/**
 * CategoryChart
 * 根據 chartType 與 durationUnit 切換 Pie/Bar 圖表組合
 *
 * @param {Array} countData      - 各分類影片數量
 * @param {Array} durationData   - 各分類影片秒數
 * @param {"pie"|"bar"} chartType
 * @param {"minutes"|"hours"} durationUnit
 */
const CategoryChart = ({
  countData,
  durationData,
  chartType,
  durationUnit,
}) => {
  // 轉換秒數到指定單位
  const convertedDurationData = useMemo(() => {
    return durationData.map((d) => {
      const secs = d.duration || 0;
      const value =
        durationUnit === "hours"
          ? +(secs / 3600).toFixed(1)
          : Math.round(secs / 60);
      return { ...d, duration: value };
    });
  }, [durationData, durationUnit]);

  const durationUnitLabel = durationUnit === "hours" ? "小時" : "分鐘";

  // 長條圖模式
  if (chartType === "bar") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h3 className="text-base font-semibold mb-4">分類次數統計圖</h3>
          <ChartTypeBar data={countData} dataKey="count" />
        </div>
        <div>
          <h3 className="text-base font-semibold mb-4">
            分類總時長統計圖（{durationUnitLabel}）
          </h3>
          <ChartTypeBar data={convertedDurationData} dataKey="duration" />
        </div>
      </div>
    );
  }

  // 甜甜圈圖 + 圖例組合模式
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
      <div>
        <h3 className="text-base font-semibold mb-4">分類次數統計圖</h3>
        <ChartWithLegend data={countData} dataKey="count" unit="部" />
      </div>
      <div>
        <h3 className="text-base font-semibold mb-4">
          分類總時長統計圖（{durationUnitLabel}）
        </h3>
        <ChartWithLegend
          data={convertedDurationData}
          dataKey="duration"
          unit={durationUnitLabel}
        />
      </div>
    </div>
  );
};

export default CategoryChart;
