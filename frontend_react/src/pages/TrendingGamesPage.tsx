import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { useTrendingGamesQuery } from "../hooks/useTrendingGamesQuery";
import TrendingChart from "../components/trending/TrendingChart";
import TrendingGameList from "../components/trending/TrendingGameList";

const TIME_RANGES = {
  7: "過去 7 天",
  14: "過去 14 天",
  30: "過去 30 天",
};

const TrendingGamesPage = () => {
  const [days, setDays] = useState<7 | 14 | 30>(30);
  const { data, isLoading, isError } = useTrendingGamesQuery(days);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📈 趨勢遊戲排行榜（{TIME_RANGES[days]}）
          </h1>
          <select
            className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white rounded px-2 py-1 text-sm"
            value={days}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if ([7, 14, 30].includes(value)) {
                setDays(value as 7 | 14 | 30);
              }
            }}
          >
            {Object.entries(TIME_RANGES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            資料載入中...
          </div>
        )}

        {isError && (() => {
          console.error("[/trending] 資料載入失敗", { isError });
          return (
            <div className="text-center text-red-500 dark:text-red-400 py-10">
              ❌ 無法載入資料
            </div>
          );
        })()}

        {data && (
          <>
            <TrendingChart
              gameList={data.gameList}
              videoCountByGameAndDate={data.videoCountByGameAndDate}
              contributorsByDateAndGame={data.contributorsByDateAndGame}
            />
            <div className="mt-10">
              <TrendingGameList
                gameList={data.gameList}
                details={data.details}
                channelInfo={data.channelInfo}
              />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default TrendingGamesPage;
