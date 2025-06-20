// src/components/channels/GroupedChannelList.jsx
import React, { useState } from "react";
import CountryFlags from "../badges/CountryFlags";
import { ChannelSelectorCard } from ".";

/**
 * 預設卡片渲染
 */
const defaultRenderCard = (channel, onClick) => (
  <ChannelSelectorCard
    key={channel.channel_id || channel.channelId}
    channel={channel}
    onClick={onClick}
  />
);

/**
 * @param {Object[]} groupedChannels - 由 groupChannelsByCountry 回傳的分組資料
 * @param {Function} onClick - 點擊頻道卡片後的處理函式
 * @param {Function} [renderCard] - （可選）自訂卡片渲染函式 (channel) => JSX
 */
const GroupedChannelList = ({ groupedChannels, onClick, renderCard }) => {
  // 展開狀態初始化（全部開啟）
  const [expandedGroups, setExpandedGroups] = useState(() =>
    Object.fromEntries(groupedChannels.map((g) => [g.code, true]))
  );

  const toggleGroup = (code) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const render = renderCard
    ? (channel) => renderCard(channel)
    : (channel) => defaultRenderCard(channel, onClick);

  return (
    <div className="space-y-6">
      {groupedChannels.map((group) => {
        const isExpanded = expandedGroups[group.code];
        const isUnclassified = group.code === "__unclassified";
        const label = isUnclassified ? "未分類" : group.code;
        const count = group.channels.length;

        return (
          <div key={group.code}>
            {/* 分組列 */}
            <button
              onClick={() => toggleGroup(group.code)}
              className="w-full flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <span className="w-4">{isExpanded ? "▼" : "▶"}</span>

              {!isUnclassified && (
                <CountryFlags countryCode={[group.code]} />
              )}
              <span>
                {label}（{count}）
              </span>

              {/* 右側延伸線 */}
              <div className="border-t border-gray-300 flex-grow ml-2" />
            </button>

            {/* 分組內容（可收合） */}
            {isExpanded && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {group.channels.map((channel) => render(channel))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupedChannelList;
