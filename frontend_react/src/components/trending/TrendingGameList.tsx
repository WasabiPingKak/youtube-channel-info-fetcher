import React, { useState } from "react";
import VideoCardSimple from "./VideoCardSimple";
import ChannelCard from "./ChannelCard";
import type { ChannelVideoGroup } from "@/types/trending";

/**
 * @param {Object} props
 * @param {string[]} props.gameList
 * @param {Object} props.details  // details[game][channelId] = { channelName, videos: [...] }
 * @param {Object} props.channelInfo  // channelInfo[channelId] = { name, thumbnail, url }
 */
const TrendingGameList = ({ gameList, details, channelInfo }) => {
  const [expandedGames, setExpandedGames] = useState({});
  const [expandedChannels, setExpandedChannels] = useState({});

  const toggleGame = (game) => {
    setExpandedGames((prev) => ({ ...prev, [game]: !prev[game] }));
  };

  return (
    <div className="mt-6 space-y-4">
      {gameList.map((game) => {
        const gameDetails = details[game] || {};
        const isOpen = expandedGames[game];

        const videoCount = Object.values(gameDetails).reduce(
          (acc: number, ch: ChannelVideoGroup) => acc + ch.videos.length,
          0
        );
        const channelCount = Object.keys(gameDetails).length;

        return (
          <div
            key={game}
            className="border rounded-xl p-4 shadow-sm bg-white dark:bg-zinc-800 dark:border-zinc-600"
          >
            {/* ✅ 可點擊的整體區域（含標題與頭像列） */}
            {!isOpen && (
              <div className="cursor-pointer" onClick={() => toggleGame(game)}>
                {/* 標題列 */}
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">{game}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    👤 {channelCount} 頻道　｜　🎬 {videoCount} 部
                  </div>
                </div>

                {/* 頻道頭像列 */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.keys(gameDetails).map((channelId) => {
                    const info = channelInfo?.[channelId];
                    if (!info?.thumbnail) return null;
                    return (
                      <img
                        key={channelId}
                        src={info.thumbnail}
                        alt={info.name}
                        title={info.name}
                        className="w-8 h-8 rounded-full border object-cover"
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 展開後的詳細列表 */}
            {isOpen && (
              <>
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleGame(game)}
                >
                  <div className="text-lg font-semibold">{game}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    👤 {channelCount} 頻道　｜　🎬 {videoCount} 部
                  </div>
                </div>

                <div className="mt-4 space-y-6">
                  {Object.entries(gameDetails).length === 0 ? (
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      （無資料）
                    </div>
                  ) : (
                    Object.entries(gameDetails)
                      .sort(([, a], [, b]) => {
                        const aDate = new Date(a.videos?.[0]?.publishedAt || 0);
                        const bDate = new Date(b.videos?.[0]?.publishedAt || 0);
                        return bDate.getTime() - aDate.getTime();
                      })
                      .map(([channelId, channelData]) => {
                        const sortedVideos = [...(channelData?.videos || [])].sort(
                          (a, b) =>
                            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                        );

                        const info = channelInfo?.[channelId];
                        if (!info) {
                          console.warn(`⚠️ 找不到頻道資訊: ${channelId}`);
                          return null;
                        }

                        return (
                          <div key={channelId} className="space-y-2">
                            <ChannelCard
                              channelId={channelId}
                              channelInfo={info}
                              videos={sortedVideos}
                            />
                          </div>
                        );
                      })
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TrendingGameList;
