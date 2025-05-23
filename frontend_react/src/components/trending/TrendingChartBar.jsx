import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import ChartLegend from "./ChartLegend";
import { COLOR_LIST } from "./chartColors";

const TrendingChartDaily = ({
  chartData,
  topGames,
  hiddenGames,
  toggleLine,
  isMobile,
  setHiddenGames,
}) => {
  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
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
          {topGames.map((game, index) =>
            hiddenGames.includes(game) ? null : (
              <Bar
                key={game}
                dataKey={game}
                stackId="games"
                fill={COLOR_LIST[index % COLOR_LIST.length]}
              />
            )
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendingChartDaily;
