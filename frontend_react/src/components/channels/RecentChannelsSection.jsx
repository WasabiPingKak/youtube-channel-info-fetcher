import React from "react";
import ChannelSelectorCard from "./ChannelSelectorCard";
import { getRecentChannelIds } from "../../utils/recentChannels";

const RecentChannelsSection = ({ channels, onClick }) => {
  const recentIds = getRecentChannelIds();

  // 篩選 channels 中有出現在 recentIds 的那幾筆
  const recentChannels = recentIds
    .map((id) => channels.find((c) => c.channel_id === id))
    .filter(Boolean); // 避免找不到對應時為 undefined

  if (recentChannels.length === 0) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
      <h2 className="text-sm font-bold text-gray-700 mb-3">最近看過的頻道</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {recentChannels.map((channel) => (
          <ChannelSelectorCard
            key={channel.channel_id}
            channel={channel}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentChannelsSection;
