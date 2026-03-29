import React, { useState } from "react";
import { PiCopySimple } from "react-icons/pi";
import CountryFlags from "@/components/badges/CountryFlags";
import VideoBadge from "@/components/common/VideoBadge";
import { getBadgesFromLiveChannel } from "@/utils/badgeUtils";
import type { LiveChannelData } from "@/types/live";

function formatStartTimeLabel(startTime: string, endTime: string | null): string {
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

function getStatusLabelAndStyle(channel: LiveChannelData): { label: string; className: string } {
  const live = channel.live;
  if (live.endTime) {
    return { label: "已收播", className: "bg-black bg-opacity-60" };
  }
  if (live.isUpcoming) {
    return { label: "即將直播", className: "bg-black bg-opacity-60" };
  }
  return { label: "直播中", className: "bg-red-600" };
}

interface LiveChannelCardProps {
  channel: LiveChannelData;
}

export default function LiveChannelCard({ channel }: LiveChannelCardProps) {
  const live = channel.live;
  const videoId = live?.videoId;
  const [copiedChannel, setCopiedChannel] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);

  if (!live || !videoId) return null;

  function handleCopy(text: string, setCopied: (v: boolean) => void, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  const startTimeLabel = formatStartTimeLabel(live.startTime, live.endTime);
  const { label, className: labelClass } = getStatusLabelAndStyle(channel);

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col border rounded-xl p-4 hover:shadow transition bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 h-full"
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

      {/* 底部區塊 */}
      <div className="mt-auto">
        {/* 直播狀態 */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {startTimeLabel}
          {live.viewers > 0 && (
            <>。{live.viewers.toLocaleString()} 人正在觀看</>
          )}
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

        {/* 複製按鈕列 */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={(e) => handleCopy(videoId, setCopiedChannel, e)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors
              ${copiedChannel
                ? "bg-green-500 text-white border-green-500"
                : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
              }`}
          >
            {copiedChannel ? "✓ 已複製" : <><PiCopySimple className="w-4 h-4" />複製直播ID</>}
          </button>
          <button
            type="button"
            onClick={(e) => handleCopy(live.title, setCopiedTitle, e)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors
              ${copiedTitle
                ? "bg-green-500 text-white border-green-500"
                : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
              }`}
          >
            {copiedTitle ? "✓ 已複製" : <><PiCopySimple className="w-4 h-4" />複製直播標題</>}
          </button>
        </div>
      </div>
    </a>
  );
}
