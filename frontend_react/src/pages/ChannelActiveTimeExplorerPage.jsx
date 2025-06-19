import React, { useMemo, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { useActiveTimeChannels } from "../hooks/useActiveTimeChannels";
import ActiveTimeFilterPanel from "../components/activeTime/ActiveTimeFilterPanel";
import ChannelHeatmapCard from "../components/activeTime/ChannelHeatmapCard";
import { useFilteredActiveChannels } from "../hooks/useFilteredActiveChannels";

export default function ChannelActiveTimeExplorerPage() {
  const { data, isLoading, isError } = useActiveTimeChannels();

  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);

  const toggleSelection = (list, setList, key) => {
    setList((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearFilter = () => {
    setSelectedWeekdays([]);
    setSelectedPeriods([]);
  };

  const { filteredChannels } = useFilteredActiveChannels(data, selectedWeekdays, selectedPeriods);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">頻道活躍時間篩選</h1>

        {/* 篩選器 */}
        <ActiveTimeFilterPanel
          selectedWeekdays={selectedWeekdays}
          selectedPeriods={selectedPeriods}
          onToggleWeekday={(key) => toggleSelection(selectedWeekdays, setSelectedWeekdays, key)}
          onTogglePeriod={(key) => toggleSelection(selectedPeriods, setSelectedPeriods, key)}
          onClear={clearFilter}
          resultCount={filteredChannels.length}
        />

        {/* 結果區塊 */}
        {isLoading && <div>載入中...</div>}
        {isError && <div className="text-red-500">資料載入失敗</div>}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels.map((channel) => (
              <ChannelHeatmapCard
                key={channel.channelId}
                channel={channel}
                filterApplied={selectedWeekdays.length > 0 || selectedPeriods.length > 0}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
