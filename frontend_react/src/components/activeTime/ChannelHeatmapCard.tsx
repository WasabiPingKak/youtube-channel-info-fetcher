import React from "react";
import ActiveTimeHeatmapMini from "./ActiveTimeHeatmapMini";

type Props = {
  channel: {
    channelId: string;
    name: string;
    thumbnail: string;
    countryCode?: string[];
    activeTime: Record<string, Record<string, number>>;
    matchRatio?: number; // 💡 來自 hook 中的附加欄位
  };
  filterApplied: boolean; // 💡 由父層告知是否有啟用篩選條件
};

export default function ChannelHeatmapCard({ channel, filterApplied }: Props) {
  return (
    <a
      href={`/videos?channel=${channel.channelId}`}
      target="_blank"
      rel="noopener noreferrer"
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

          {/* ✅ 只在篩選有作用時顯示活躍佔比 */}
          {filterApplied && channel.matchRatio !== undefined && (
            <div className="text-xs text-gray-500 mt-[2px]">
              活躍佔比：{(channel.matchRatio * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <ActiveTimeHeatmapMini activeTime={channel.activeTime} />
    </a>
  );
}
