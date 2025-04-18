import React, { useState } from "react";
import CategoryChart from "./CategoryChart";
import ChartSwitcher from "./ChartSwitcher";

const CategoryChartSection = ({ videos }) => {
  const [chartType, setChartType] = useState("pie"); // "pie" or "bar"

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">主分類統計圖表</h2>
      <ChartSwitcher chartType={chartType} setChartType={setChartType} />
      <CategoryChart videos={videos} chartType={chartType} />
    </div>
  );
};

export default CategoryChartSection;
