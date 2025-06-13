import React from "react";
import { FaEyeSlash } from "react-icons/fa6";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import DeveloperBadge from "@/components/badges/DeveloperBadge";
import CountryFlags from "@/components/badges/CountryFlags";
import ActiveTimeBar from "./ActiveTimeBar";

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
      <div className="flex flex-col gap-1 flex-1">
        {/* 開發者徽章 */}
        <DeveloperBadge isAuthor={isAuthor} />

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

        {/* 國旗徽章 */}
        <CountryFlags countryCode={channel.countryCode} />

        {/* 最近上片 */}
        {channel.lastVideoUploadedAt && (
          <div className="text-xs text-gray-500 mt-1">
            最近上片：{formatRelativeTime(channel.lastVideoUploadedAt)}
          </div>
        )}

        {/* 活躍時段 */}
        <ActiveTimeBar activeTimeAll={channel.active_time_all} />
      </div>
    </div>
  );
};

export default ChannelSelectorCard;
