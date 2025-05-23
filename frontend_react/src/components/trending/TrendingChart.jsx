import React, { useState, useEffect } from "react";
import ChartLegend from "./ChartLegend";
import TrendingChartCumulative from "./TrendingChartCumulative";
import TrendingChartDaily from "./TrendingChartBar";

const TrendingChart = ({ chartData, topGames }) => {
  const [mode, setMode] = useState("cumulative");
  const [hiddenGames, setHiddenGames] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleLine = (game) => {
    setHiddenGames((prev) =>
      prev.includes(game)
        ? prev.filter((g) => g !== game)
        : [...prev, game]
    );
  };

  return (
    <div className="w-full">
      {/* 🔁 切換模式按鈕 */}
      <div className="flex justify-end mb-3">
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setMode("daily")}
            className={`px-2 py-1 rounded border ${
              mode === "daily" ? "bg-gray-800 text-white" : "text-gray-700"
            }`}
          >
            📊 每日
          </button>
          <button
            onClick={() => setMode("cumulative")}
            className={`px-2 py-1 rounded border ${
              mode === "cumulative" ? "bg-gray-800 text-white" : "text-gray-700"
            }`}
          >
            📈 累計
          </button>
        </div>
      </div>

      {mode === "cumulative" && (
        <TrendingChartCumulative
          chartData={chartData}
          topGames={topGames}
          hiddenGames={hiddenGames}
          toggleLine={toggleLine}
          isMobile={isMobile}
          setHiddenGames={setHiddenGames}
        />
      )}


      {mode === "daily" && (
        <TrendingChartDaily
          chartData={chartData}
          topGames={topGames}
          hiddenGames={hiddenGames}
          toggleLine={toggleLine}
          isMobile={isMobile}
          setHiddenGames={setHiddenGames}
        />
      )}
    </div>
  );
};

export default TrendingChart;