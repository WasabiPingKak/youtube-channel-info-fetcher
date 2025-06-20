import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelectableChannelList } from "../hooks/useSelectableChannelList";
import MainLayout from "../components/layout/MainLayout";
import { addRecentChannel } from "../utils/recentChannels";
import {
  ChannelSelectorCard,
  NewlyJoinedChannelsSection,
} from "../components/channels";
import ActiveTimeTabSection from "../components/channels/ActiveTimeTabSection";
import FlagGroupingToggle from "../components/channels/FlagGroupingToggle";
import GroupedChannelList from "../components/channels/GroupedChannelList";
import { groupChannelsByCountry } from "../utils/groupChannelsByCountry";

const ChannelSelectorPage = () => {
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState("latest");

  const [isFlagGrouping, setIsFlagGrouping] = useState(() =>
    localStorage.getItem("useFlagGrouping") === "true"
  );

  const navigate = useNavigate();

  const {
    isLoading,
    channels,
    newlyJoinedChannels,
    error,
  } = useSelectableChannelList(searchText, sortMode);

  const handleClick = (channelId) => {
    addRecentChannel(channelId);
    navigate(`/videos?channel=${channelId}`);
  };

  const isActivityTab = sortMode === "activeTime";

  // 決定分組或平鋪顯示內容
  const sortedChannels = [...channels];
  let sortFn = (a, b) => 0;
  if (sortMode === "latest") {
    sortFn = (a, b) =>
      new Date(b.lastUploadAt).getTime() - new Date(a.lastUploadAt).getTime();
  } else if (sortMode === "alphabetical") {
    sortFn = (a, b) => a.name.localeCompare(b.name);
  }

  const groupedChannels = isFlagGrouping
    ? groupChannelsByCountry(sortedChannels, sortFn)
    : [];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">頻道列表</h1>

        {/* 🔍 搜尋欄 */}
        <input
          type="text"
          placeholder="輸入頻道名稱..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-4"
        />

        {/* ✅ 最近使用清單 */}
        {!isLoading && searchText === "" && (
          <>
            <NewlyJoinedChannelsSection
              channels={newlyJoinedChannels}
              onClick={handleClick}
            />

          </>
        )}

        {/* 國旗分組開關 */}
        <FlagGroupingToggle
          isEnabled={isFlagGrouping}
          onToggle={(val) => {
            setIsFlagGrouping(val);
            localStorage.setItem("useFlagGrouping", String(val));
          }}
        />

        {/* 排序 Tabs */}
        <div className="flex gap-2 mb-4 text-sm font-medium">
          <button
            className={`px-3 py-1 rounded-lg border ${sortMode === "latest"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300"
              }`}
            onClick={() => setSortMode("latest")}
          >
            最新上片
          </button>
          <button
            className={`px-3 py-1 rounded-lg border ${sortMode === "activeTime"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300"
              }`}
            onClick={() => setSortMode("activeTime")}
          >
            活動時間
          </button>
          <button
            className={`px-3 py-1 rounded-lg border ${sortMode === "alphabetical"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300"
              }`}
            onClick={() => setSortMode("alphabetical")}
          >
            字典排序
          </button>
        </div>

        {/* ❌ 錯誤狀態 */}
        {error && (
          <div className="text-red-600 font-semibold mb-4">
            無法載入頻道資料：{error.message}
          </div>
        )}

        {/* 🧠 活動時間 tab */}
        {isActivityTab && (
          <ActiveTimeTabSection
            baseChannels={channels}
            isFlagGrouping={isFlagGrouping}
            onClick={handleClick}
          />
        )}

        {/* ✅ 其他排序模式 */}
        {!isLoading && !isActivityTab && channels.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-gray-700 mb-3">全部頻道</h2>
            <p className="text-xs text-gray-400 mb-3">
              {sortMode === "alphabetical"
                ? "按照頻道名稱字典順序排列"
                : "按照最近上片時間排列"}
            </p>

            {isFlagGrouping ? (
              <GroupedChannelList
                groupedChannels={groupedChannels}
                onClick={handleClick}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <ChannelSelectorCard
                    key={channel.channel_id}
                    channel={channel}
                    onClick={handleClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && !isActivityTab && channels.length === 0 && (
          <div className="text-center text-gray-500 mt-10">查無符合的頻道</div>
        )}
      </div>
    </MainLayout>
  );
};

export default ChannelSelectorPage;
