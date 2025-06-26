import React from "react";

const ChartSwitcher = ({ chartType, setChartType, durationUnit, setDurationUnit }) => {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {/* 圖表類型切換 */}
      <div className="flex gap-1">
        <button
          className={`px-4 py-1 rounded ${chartType === "pie"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-zinc-700"
            }`}
          onClick={() => setChartType("pie")}
        >
          圓餅圖
        </button>
        <button
          className={`px-4 py-1 rounded ${chartType === "bar"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-zinc-700"
            }`}
          onClick={() => setChartType("bar")}
        >
          長條圖
        </button>
      </div>

      {/* 時長單位切換 */}
      <div className="flex gap-1">
        <button
          className={`px-4 py-1 rounded ${durationUnit === "hours"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-zinc-700"
            }`}
          onClick={() => setDurationUnit("hours")}
        >
          小時
        </button>
        <button
          className={`px-4 py-1 rounded ${durationUnit === "minutes"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-zinc-700"
            }`}
          onClick={() => setDurationUnit("minutes")}
        >
          分鐘
        </button>
      </div>
    </div>
  );
};

export default ChartSwitcher;
