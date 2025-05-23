import React from "react";
import MainLayout from "../components/layout/MainLayout";
import { useTrendingGamesQuery } from "../hooks/useTrendingGamesQuery";
import TrendingChart from "../components/trending/TrendingChart";
import TrendingGameList from "../components/trending/TrendingGameList";

const TrendingGamesPage = () => {
    const { data, isLoading, isError } = useTrendingGamesQuery();

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">📈 趨勢遊戲排行榜（過去 30 天）</h1>

                {isLoading && (
                    <div className="text-center text-gray-500 py-10">資料載入中...</div>
                )}

                {isError && (
                    <div className="text-center text-red-500 py-10">
                        ❌ 無法載入資料
                        {console.error("[/trending] 資料載入失敗", { data, isError })}
                    </div>
                )}

                {data && (
                    <>
                        <TrendingChart
                            chartData={data.chartData}
                            topGames={data.topGames}
                        />

                        <div className="mt-10">
                            <TrendingGameList
                                topGames={data.topGames}
                                details={data.details}
                                summaryStats={data.summaryStats}
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
