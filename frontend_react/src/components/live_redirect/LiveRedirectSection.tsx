import React from "react";
import LiveChannelCard from "./LiveChannelCard";
import { groupChannelsByCountry } from "@/utils/groupChannelsByCountry";
import GroupedChannelList from "@/components/channels/GroupedChannelList";
import type { LiveChannelData, LiveInfo } from "@/types/live";

interface LiveRedirectSectionProps {
  title: string;
  type: "upcoming" | "live" | "ended";
  channels: LiveChannelData[];
  groupByCountry?: boolean;
  sortMode: "time" | "viewers";
  sortAsc: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function LiveRedirectSection({
  title,
  type,
  channels,
  groupByCountry = false,
  sortMode,
  sortAsc,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
}: LiveRedirectSectionProps) {
  // eslint-disable-next-line react-hooks/purity -- now 用於排序計算，不影響 UI 純度
  const now = Date.now();

  const sortFn = (a: LiveChannelData, b: LiveChannelData) => {
    const lA = a.live;
    const lB = b.live;

    const timeDiff = (live: LiveInfo) => {
      const raw = type === "ended" ? live.endTime : live.startTime;
      const parsed = Date.parse(raw ?? "");
      if (isNaN(parsed)) return Infinity;
      return Math.floor((now - parsed) / 60000); // 分鐘差
    };

    const valA = sortMode === "viewers" ? (lA.viewers ?? 0) : timeDiff(lA);
    const valB = sortMode === "viewers" ? (lB.viewers ?? 0) : timeDiff(lB);
    return sortAsc ? valA - valB : valB - valA;
  };

  const sortedChannels = [...channels].sort(sortFn);

  const renderCards = (list: LiveChannelData[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((channel: LiveChannelData) => (
        <LiveChannelCard key={channel.live.videoId} channel={channel} />
      ))}
    </div>
  );

  return (
    <div className="mb-8">
      {/* 標題 + 可選擇的折疊控制 */}
      <div className="flex items-center gap-4 mb-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title}
        </h2>
        {collapsible && (
          <button
            onClick={onToggleCollapse}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {collapsed ? "顯示" : "隱藏"}
          </button>
        )}
      </div>

      {/* 卡片列表 */}
      {!collapsed && (
        groupByCountry ? (
          <GroupedChannelList
            groupedChannels={groupChannelsByCountry(sortedChannels, sortFn)}
            onClick={() => {}}
            renderCard={(channel) => (
              <LiveChannelCard key={(channel as LiveChannelData).live.videoId} channel={channel as LiveChannelData} />
            )}
          />
        ) : (
          renderCards(sortedChannels)
        )
      )}
    </div>
  );
}
