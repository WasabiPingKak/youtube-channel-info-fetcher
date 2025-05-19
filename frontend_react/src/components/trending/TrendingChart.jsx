import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import ChartLegend from "./ChartLegend";
import { COLOR_LIST } from "./chartColors";
import { accumulateChartData } from "./chartUtils";



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

  const displayedData =
    mode === "cumulative" ? accumulateChartData(chartData, topGames) : chartData;

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

      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis
              dataKey="date"
              angle={35}
              interval={0}
              height={50}
              tick={{ textAnchor: "start" }}
              tickFormatter={(_, index) =>
                isMobile
                  ? index % 4 === 0
                    ? chartData[index].date.slice(5)
                    : ""
                  : chartData[index].date.slice(5)
              }
            />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value, name) => [`${value} 部`, name]} />
            <Legend
                content={
                    <ChartLegend
                    topGames={topGames}
                    hiddenGames={hiddenGames}
                    setHiddenGames={setHiddenGames}
                    toggleLine={toggleLine}
                    />
                }
            />
            {topGames.map((game, index) => (
              <Line
                key={game}
                type="monotone"
                dataKey={game}
                stroke={COLOR_LIST[index % COLOR_LIST.length]}
                strokeWidth={2}
                dot={false}
                strokeOpacity={hiddenGames.includes(game) ? 0 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendingChart;