import React from "react";

const ChartSwitcher = ({ chartType, setChartType }) => {
  return (
    <div className="mb-4">
      <button
        className={`mr-2 px-4 py-1 rounded ${chartType === "pie" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        onClick={() => setChartType("pie")}
      >
        圓餅圖
      </button>
      <button
        className={`px-4 py-1 rounded ${chartType === "bar" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        onClick={() => setChartType("bar")}
      >
        長條圖
      </button>
    </div>
  );
};

export default ChartSwitcher;
