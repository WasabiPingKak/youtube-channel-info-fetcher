import React from "react";
import CountryFlags from "@/components/badges/CountryFlags";
import VideoBadge from "@/components/common/VideoBadge";
import { getBadgesFromLiveChannel } from "@/utils/badgeUtils";

function formatStartTimeLabel(startTime, endTime) {
  const now = new Date();
  const t = new Date(endTime || startTime);
  const diffMs = now.getTime() - t.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffAbs = Math.abs(diffMin);
  const diffHour = Math.round(diffAbs / 60);

  if (isNaN(diffMin)) return "時間錯誤";

  if (endTime) {
    if (diffAbs < 1) return "剛剛收播";
    return diffAbs < 60
      ? `${diffAbs} 分鐘前收播`
      : `約 ${diffHour} 小時前收播`;
  }

  if (diffMin < -1) {
    return diffAbs < 60
      ? `預計 ${diffAbs} 分鐘後開播`
      : `預計約 ${diffHour} 小時後開播`;
  }

  if (diffMin > 1) {
    return diffAbs < 60
      ? `開播 ${diffAbs} 分鐘前`
      : `約 ${diffHour} 小時前開播`;
  }

  return "剛剛開播";
}

function getStatusLabelAndStyle(channel) {
  const live = channel.live;
  if (live.endTime) {
    return { label: "已收播", className: "bg-black bg-opacity-60" };
  }
  if (live.isUpcoming) {
    return { label: "即將直播", className: "bg-black bg-opacity-60" };
  }
  return { label: "直播中", className: "bg-red-600" };
}

export default function LiveChannelCard({ channel }) {
  const live = channel.live;
  const videoId = live?.videoId;

  if (!live || !videoId) return null;

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  const startTimeLabel = formatStartTimeLabel(live.startTime, live.endTime);
  const { label, className: labelClass } = getStatusLabelAndStyle(channel);

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-xl p-4 hover:shadow transition bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
    >
      {/* 頻道資訊 */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={channel.thumbnail}
          alt={channel.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {channel.name}
          </div>
          {channel.countryCode && channel.countryCode.length > 0 && (
            <div className="mt-1">
              <CountryFlags countryCode={channel.countryCode} />
            </div>
          )}
          {channel.badge && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {channel.badge}
            </div>
          )}
        </div>
      </div>

      {/* 分類 Badges */}
      <div className="flex flex-wrap gap-1 mb-1">
        {getBadgesFromLiveChannel(channel).map((badge, index) => (
          <VideoBadge key={index} badge={badge} />
        ))}
      </div>

      {/* 直播縮圖 + 狀態標籤 */}
      <div className="relative mb-2">
        <img
          src={thumbnailUrl}
          alt={live.title}
          className="w-full rounded-lg object-cover aspect-video"
        />
        <div
          className={`absolute bottom-1 right-2 text-white text-xs px-2 py-0.5 rounded ${labelClass}`}
        >
          {label}
        </div>
      </div>

      {/* 標題與開播資訊 */}
      <div className="text-sm font-semibold line-clamp-2 mb-1 text-gray-900 dark:text-white">
        {live.title}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{startTimeLabel}</div>

      {live.viewers > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {live.viewers.toLocaleString()} 人正在觀看
        </div>
      )}
    </a>
  );
}
