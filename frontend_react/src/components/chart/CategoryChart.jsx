import React, { useMemo } from "react";
import ChartTypePie from "./ChartTypePie";
import ChartTypeBar from "./ChartTypeBar";

/**
 * @param {Object} props
 * @param {Array}  props.countData      - 各分類影片數量
 * @param {Array}  props.durationData   - 各分類影片秒數
 * @param {"pie" | "bar"} props.chartType
 * @param {"minutes" | "hours"} props.durationUnit
 */
const CategoryChart = ({
  countData,
  durationData,
  chartType,
  durationUnit,
}) => {
  // 根據 chartType 決定使用 Pie 或 Bar；兩張圖同時切換
  const ChartComponent = chartType === "pie" ? ChartTypePie : ChartTypeBar;

  /** 將秒數轉成分鐘或小時 */
  const convertedDurationData = useMemo(() => {
    return durationData.map((d) => {
      const rawSeconds = d.duration || 0;
      const value =
        durationUnit === "hours"
          ? +(rawSeconds / 3600).toFixed(1)
          : Math.round(rawSeconds / 60);
      return { ...d, duration: value };
    });
  }, [durationData, durationUnit]);

  /** 依單位決定顯示字樣 */
  const durationUnitLabel = durationUnit === "hours" ? "小時" : "分鐘";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* —— 影片數量 —— */}
      <div>
        <h3 className="text-base font-semibold mb-1">分類次數統計圖</h3>
        <ChartComponent data={countData} dataKey="count" unit="部" />
      </div>

      {/* —— 總時長 —— */}
      <div>
        <h3 className="text-base font-semibold mb-1">
          分類總時長統計圖（{durationUnitLabel}）
        </h3>
        <ChartComponent
          data={convertedDurationData}
          dataKey="duration"
          unit={durationUnitLabel}
        />
      </div>
    </div>
  );
};

export default CategoryChart;
