import React from "react";
import { FaEyeSlash } from "react-icons/fa6";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

const ADMIN_CHANNEL_ID = import.meta.env.VITE_ADMIN_CHANNEL_ID;

const ChannelSelectorCard = ({ channel, onClick }) => {
  const isAuthor = channel.channel_id === ADMIN_CHANNEL_ID;

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
        <div className="font-bold text-base text-gray-900 flex items-center gap-2">
          {channel.name}
          {channel.enabled !== true && (
            <span className="flex items-center gap-1 text-gray-500 text-sm">
              <FaEyeSlash className="inline-block" />
              此頻道未公開
            </span>
          )}
        </div>

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

        {/* 顯示自訂國旗徽章 */}
        {Array.isArray(channel.countryCode) && channel.countryCode.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {channel.countryCode.map((code) => (
              <span
                key={code}
                className={`fi fi-${code.toLowerCase()} w-5 h-3 rounded-sm border`}
                title={code}
              />
            ))}
          </div>
        )}

        {/* ✅ 最近上片資訊 */}
        {channel.lastVideoUploadedAt && (
          <div className="text-xs text-gray-500 mt-1">
            最近上片：{formatRelativeTime(channel.lastVideoUploadedAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSelectorCard;
