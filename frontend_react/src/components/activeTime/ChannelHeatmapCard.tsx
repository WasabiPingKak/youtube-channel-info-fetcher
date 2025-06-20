import React from "react";
import ActiveTimeHeatmapMini from "./ActiveTimeHeatmapMini";
import SmartLink from "@/components/common/SmartLink"; // ← 根據你的專案路徑調整匯入位置

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
      className="block border rounded-xl p-4 hover:shadow transition"
    >
      <div className="flex gap-2 items-start mb-2">
        <img
          src={channel.thumbnail}
          alt={channel.name}
          className="w-6 h-6 rounded-full"
        />
        <div className="flex flex-col">
          <div className="font-semibold">{channel.name}</div>

          <div className="flex gap-1 mt-[2px]">
            {channel.countryCode?.map((code) => (
              <span
                key={code}
                className={`fi fi-${code.toLowerCase()}`}
                title={code}
              />
            ))}
          </div>

          {/* ✅ 顯示熱度分數 */}
          {filterApplied && channel.matchRatio !== undefined && (
            <div className="text-xs text-gray-500 mt-[2px]">
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
