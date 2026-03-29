import React, { useMemo } from "react";
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
import CustomTooltipWithColor from "./CustomTooltipWithColor";
import type { TrendingGamesResponse } from "@/types/trending";

interface Props {
  gameList: TrendingGamesResponse["gameList"];
  contributorsByDateAndGame: TrendingGamesResponse["contributorsByDateAndGame"];
  hiddenGames: string[];
  toggleLine: (game: string) => void;
  isMobile: boolean;
  setHiddenGames: (games: string[]) => void;
}

const TrendingChartDaily = ({
  gameList,
  contributorsByDateAndGame,
  hiddenGames,
  toggleLine,
  isMobile,
  setHiddenGames,
}: Props) => {
  const chartData = useMemo(() => {
    return Object.entries(contributorsByDateAndGame).map(([date, gameMap]) => {
      const entry: Record<string, unknown> = { date, tooltipData: {} as Record<string, unknown[]> };
      gameList.forEach((game: string) => {
        const channels = gameMap[game];
        if (channels) {
          const count = Object.values(channels).reduce(
            (sum, item) => sum + item.count,
            0
          );
          entry[game] = count;
          (entry.tooltipData as Record<string, unknown[]>)[game] = Object.values(channels);
        } else {
          entry[game] = 0;
          (entry.tooltipData as Record<string, unknown[]>)[game] = [];
        }
      });
      return entry;
    });
  }, [contributorsByDateAndGame, gameList]);

  const isDark = typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div
      className="w-full h-[500px]"
      style={{
        "--recharts-tick-color": isDark ? "#ddd" : "#000",
        "--recharts-tooltip-bg": isDark ? "#1f2937" : "#fff", // Tailwind zinc-800
        colorScheme: "light dark",
      } as React.CSSProperties}
    >
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
            tick={{
              textAnchor: "start",
              fill: "var(--recharts-tick-color)",
            }}
            tickFormatter={(_, index) =>
              isMobile
                ? index % 4 === 0
                  ? (chartData[index].date as string).slice(5)
                  : ""
                : (chartData[index].date as string).slice(5)
            }
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--recharts-tick-color)" }}
          />
          <Tooltip content={<CustomTooltipWithColor active={false} payload={[]} label="" />} />
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
          {gameList.map((game: string, index: number) =>
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
