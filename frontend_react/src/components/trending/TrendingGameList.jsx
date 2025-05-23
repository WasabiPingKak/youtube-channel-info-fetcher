import React, { useState } from "react";
import VideoCardSimple from "./VideoCardSimple";
import ChannelCard from "./ChannelCard";

/**
 * @param {Object} props
 * @param {string[]} props.topGames
 * @param {Object} props.details  // details[game][channelId] = [VideoItem, ...]
 * @param {Object} props.summaryStats
 * @param {Object} props.channelInfo  // channelInfo[channelId] = { name, thumbnail, url }
 */
const TrendingGameList = ({ topGames, details, summaryStats, channelInfo }) => {
  const [expandedGames, setExpandedGames] = useState({});
  const [expandedChannels, setExpandedChannels] = useState({});

  const toggleGame = (game) => {
    setExpandedGames((prev) => ({ ...prev, [game]: !prev[game] }));
  };

  const toggleChannel = (game, channelId) => {
    const key = `${game}::${channelId}`;
    setExpandedChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mt-6 space-y-4">
      {topGames.map((game) => {
        const gameDetails = details[game] || {};
        const stats = summaryStats[game] || { videoCount: 0, channelCount: 0 };
        const isOpen = expandedGames[game];

        return (
          <div key={game} className="border rounded-xl p-4 shadow-sm bg-white">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleGame(game)}
            >
              <div className="text-lg font-semibold">{game}</div>
              <div className="text-sm text-gray-600">
                🎬 {stats.videoCount} 部　｜　👤 {stats.channelCount} 頻道
              </div>
            </div>

            {isOpen && (
              <div className="mt-4 space-y-6">
                {Object.entries(gameDetails).length === 0 ? (
                  <div className="text-sm text-gray-400">（無資料）</div>
                ) : (
                  Object.entries(gameDetails)
                    .sort(([, aVideos], [, bVideos]) => {
                      const aDate = new Date(aVideos?.[0]?.publishDate || 0);
                      const bDate = new Date(bVideos?.[0]?.publishDate || 0);
                      return bDate - aDate;
                    })
                    .map(([channelId, videos]) => {
                      const key = `${game}::${channelId}`;

                      const safeVideos = Array.isArray(videos) ? videos : [];
                      const sortedVideos = [...safeVideos].sort(
                        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
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
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TrendingGameList;
