import React, { useState, useMemo } from "react";
import { useActiveTimeChannels } from "../../hooks/useActiveTimeChannels";
import { useFilteredActiveChannels } from "../../hooks/useFilteredActiveChannels";
import ActiveTimeFilterPanel from "../activeTime/ActiveTimeFilterPanel";
import ChannelHeatmapCard from "../activeTime/ChannelHeatmapCard";
import GroupedChannelList from "../channels/GroupedChannelList";
import { groupChannelsByCountry } from "../../utils/groupChannelsByCountry";

export default function ActiveTimeTabSection({
  baseChannels,
  isFlagGrouping = false,
  onClick,
}) {
  const { data, isLoading, isError } = useActiveTimeChannels();
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);

  const enrichedChannels = useMemo(() => {
    if (!data?.channels) return [];

    const baseMap = new Map();
    baseChannels.forEach((b) => {
      const id = b.channelId || b.channel_id;
      if (id) baseMap.set(id, b);
    });

    return (
      data.channels
        .map((ch) => {
          const ref = baseMap.get(ch.channelId);
          if (!ref) return null;
          if (ref.enabled === false) return null;
          return {
            ...ch,
            enabled: true,
            lastVideoUploadedAt: ref.lastVideoUploadedAt ?? null,
          };
        })
        .filter(Boolean)
    );
  }, [data, baseChannels]);

  const { filteredChannels } = useFilteredActiveChannels(
    { channels: enrichedChannels },
    selectedWeekdays,
    selectedPeriods
  );

  const filterApplied = selectedWeekdays.length > 0 || selectedPeriods.length > 0;

  if (isLoading) return <div>載入中...</div>;
  if (isError) return <div className="text-red-500">無法載入活動時間快取資料</div>;

  return (
    <div className="mt-6">
      {/* 篩選器 */}
      <ActiveTimeFilterPanel
        selectedWeekdays={selectedWeekdays}
        setSelectedWeekdays={setSelectedWeekdays}
        selectedPeriods={selectedPeriods}
        setSelectedPeriods={setSelectedPeriods}
        resultCount={filteredChannels.length}
      />

      <p className="text-xs text-gray-400 mt-4 mb-2">
        依據你選擇的活動時間區段，依活躍佔比排序
      </p>

      {/* 結果區塊 */}
      {filteredChannels.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">查無符合的頻道</div>
      ) : isFlagGrouping ? (
        <GroupedChannelList
          groupedChannels={groupChannelsByCountry(filteredChannels, () => 0)}
          onClick={onClick}
          renderCard={(channel) => (
            <ChannelHeatmapCard
              key={channel.channelId}
              channel={channel}
              filterApplied={filterApplied}
              highlightWeekdays={selectedWeekdays}
              highlightPeriods={selectedPeriods}
            />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((channel) => (
            <ChannelHeatmapCard
              key={channel.channelId}
              channel={channel}
              filterApplied={filterApplied}
              highlightWeekdays={selectedWeekdays}
              highlightPeriods={selectedPeriods}
            />
          ))}
        </div>
      )}
    </div>
  );
}
