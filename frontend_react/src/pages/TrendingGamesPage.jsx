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
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useTrendingGamesQuery(days);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            📈 趨勢遊戲排行榜（{TIME_RANGES[days]}）
          </h1>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={days}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if ([7, 14, 30].includes(value)) {
                setDays(value);
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
          <div className="text-center text-gray-500 py-10">資料載入中...</div>
        )}

        {isError && (
          <div className="text-center text-red-500 py-10">
            ❌ 無法載入資料
            {console.error("[/trending] 資料載入失敗", { isError })}
          </div>
        )}

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
