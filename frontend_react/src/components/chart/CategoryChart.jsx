import React from "react";
import ChartTypePie from "./ChartTypePie";
import ChartTypeBar from "./ChartTypeBar";

const CategoryChart = ({ countData, durationData, chartType }) => {
  const ChartComponent = chartType === "pie" ? ChartTypePie : ChartTypeBar;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <h3 className="text-base font-semibold mb-1">分類次數統計圖</h3>
        <ChartComponent data={countData} dataKey="count" />
      </div>
      <div>
        <h3 className="text-base font-semibold mb-1">分類總時長統計圖（分鐘）</h3>
        <ChartComponent data={durationData} dataKey="duration" />
      </div>
    </div>
  );
};

export default CategoryChart;
