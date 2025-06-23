import React from "react";
import LiveChannelCard from "./LiveChannelCard";
import { groupChannelsByCountry } from "@/utils/groupChannelsByCountry";
import GroupedChannelList from "@/components/channels/GroupedChannelList";

export default function LiveRedirectSection({
  title,
  type,                // "upcoming" | "live" | "ended"
  channels,
  groupByCountry = false,
  sortMode,            // "time" | "viewers"
  sortAsc,             // boolean
}) {
  const now = Date.now();

  const sortFn = (a, b) => {
    const lA = a.live;
    const lB = b.live;

    const timeDiff = (live) => {
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

  const renderCards = (list) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((channel) => (
        <LiveChannelCard key={channel.live.videoId} channel={channel} />
      ))}
    </div>
  );

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>

      {groupByCountry ? (
        <GroupedChannelList
          groupedChannels={groupChannelsByCountry(sortedChannels, sortFn)}
          renderCard={(channel) => (
            <LiveChannelCard key={channel.live.videoId} channel={channel} />
          )}
        />
      ) : (
        renderCards(sortedChannels)
      )}
    </div>
  );
}
