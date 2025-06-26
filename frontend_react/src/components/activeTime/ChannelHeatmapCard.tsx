import React from "react";
import ActiveTimeHeatmapMini from "./ActiveTimeHeatmapMini";
import SmartLink from "@/components/common/SmartLink";
import CountryFlags from "../badges/CountryFlags";

type Props = {
  channel: {
    channelId: string;
    name: string;
    thumbnail: string;
    countryCode?: string[];
    activeTime: Record<string, Record<string, number>>;
    matchRatio?: number;
  };
  filterApplied?: boolean;
  highlightWeekdays?: string[];
  highlightPeriods?: string[];
};

export default function ChannelHeatmapCard({
  channel,
  filterApplied,
  highlightWeekdays = [],
  highlightPeriods = [],
}: Props) {
  return (
    <SmartLink
      to={`/videos?channel=${channel.channelId}`}
      className="block border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 rounded-xl p-4 hover:shadow transition"
    >
      <div className="flex gap-2 items-start mb-2">
        <img
          src={channel.thumbnail}
          alt={channel.name}
          className="w-6 h-6 rounded-full"
        />
        <div className="flex flex-col">
          <div className="font-semibold text-gray-900 dark:text-gray-100">{channel.name}</div>

          <div className="mt-[2px]">
            <CountryFlags countryCode={channel.countryCode} />

            {/* 🧪 Debug 用：顯示實際 countryCode 值 */}
            {channel.countryCode && (
              <div className="text-xs text-red-500 mt-1">
                [Debug] 國碼：{Array.isArray(channel.countryCode)
                  ? channel.countryCode.join(", ")
                  : channel.countryCode}
              </div>
            )}
          </div>

          {/* ✅ 顯示熱度分數 */}
          {filterApplied && channel.matchRatio !== undefined && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-[2px]">
              活躍熱度：{channel.matchRatio} 分
            </div>
          )}
        </div>
      </div>

      <ActiveTimeHeatmapMini
        activeTime={channel.activeTime}
        highlightWeekdays={highlightWeekdays}
        highlightPeriods={highlightPeriods}
      />
    </SmartLink>
  );
}
