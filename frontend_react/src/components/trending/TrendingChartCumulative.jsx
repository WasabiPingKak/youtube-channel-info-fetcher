import React from "react";
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
import CustomTooltip from "./CustomTooltip";

const TrendingChartCumulative = ({
  gameList,
  videoCountByGameAndDate,
  hiddenGames,
  toggleLine,
  isMobile,
  setHiddenGames,
}) => {
  const displayedData = accumulateChartData(videoCountByGameAndDate, gameList);

  return (
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
                  ? displayedData[index].date.slice(5)
                  : ""
                : displayedData[index].date.slice(5)
            }
          />
          <YAxis allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={
              <ChartLegend
                topGames={gameList}
                hiddenGames={hiddenGames}
                setHiddenGames={setHiddenGames}
                toggleLine={toggleLine}
              />
            }
          />
          {gameList.map((game, index) => (
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
  );
};

export default TrendingChartCumulative;
