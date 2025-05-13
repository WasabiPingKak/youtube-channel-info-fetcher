import React from "react";

const DEFAULT_CHANNEL_ID = import.meta.env.VITE_DEFAULT_CHANNEL_ID;

const ChannelSelectorCard = ({ channel, onClick }) => {
  const isAuthor = channel.channel_id === DEFAULT_CHANNEL_ID;

  return (
    <div
      className="cursor-pointer bg-white rounded-xl shadow hover:shadow-md p-4 flex items-center gap-4 transition-all"
      onClick={() => onClick(channel.channel_id)}
    >
      <img
        src={channel.thumbnail}
        alt={channel.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex flex-col gap-1">
        {/* 頻道名稱 */}
        <div className="font-bold text-base text-gray-900">{channel.name}</div>

        {/* 開發者徽章（下方顯示） */}
        {isAuthor && (
          <div>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
              title="本站開發者"
            >
              💻 本站開發者
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSelectorCard;
