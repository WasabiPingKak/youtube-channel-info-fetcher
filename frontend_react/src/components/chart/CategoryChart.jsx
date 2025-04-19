import React, { useMemo } from "react";
import ChartTypePie from "./ChartTypePie";
import ChartTypeBar from "./ChartTypeBar";

const CategoryChart = ({ countData, durationData, chartType, durationUnit }) => {
  const ChartComponent = chartType === "pie" ? ChartTypePie : ChartTypeBar;

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <h3 className="text-base font-semibold mb-1">分類次數統計圖</h3>
        <ChartComponent data={countData} dataKey="count" />
      </div>
      <div>
        <h3 className="text-base font-semibold mb-1">
          分類總時長統計圖（{durationUnit === "hours" ? "小時" : "分鐘"}）
        </h3>
        <ChartComponent data={convertedDurationData} dataKey="duration" />
      </div>
    </div>
  );
};

export default CategoryChart;
