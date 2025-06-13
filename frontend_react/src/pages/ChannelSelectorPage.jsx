import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelectableChannelList } from "../hooks/useSelectableChannelList";
import MainLayout from "../components/layout/MainLayout";
import { addRecentChannel } from "../utils/recentChannels";
import {
  ChannelSelectorCard,
  NewlyJoinedChannelsSection,
} from "../components/channels";

const ChannelSelectorPage = () => {
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState("latest");
  const [activeTimePeriod, setActiveTimePeriod] = useState("midnight"); // 子分類預設凌晨

  const navigate = useNavigate();

  const {
    isLoading,
    channels,
    newlyJoinedChannels,
    error,
  } = useSelectableChannelList(searchText, sortMode, activeTimePeriod);

  const handleClick = (channelId) => {
    addRecentChannel(channelId);
    navigate(`/videos?channel=${channelId}`);
  };

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

        {/* ✅ 最近使用清單（只有搜尋為空時才顯示） */}
        {!isLoading && searchText === "" && (
          <>
            {/* <RecentChannelsSection channels={channels} onClick={handleClick} /> */}
            <NewlyJoinedChannelsSection
              channels={newlyJoinedChannels}
              onClick={handleClick}
            />
          </>
        )}

        {/* 🕘 Loading 狀態 */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {/* ❌ 錯誤狀態 */}
        {error && (
          <div className="text-red-600 font-semibold mb-4">
            無法載入頻道資料：{error.message}
          </div>
        )}

        {/* 排序 Tabs */}
        {!isLoading && (
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
              className={`px-3 py-1 rounded-lg border ${sortMode === "alphabetical"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
                }`}
              onClick={() => setSortMode("alphabetical")}
            >
              字典排序
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
          </div>
        )}

        {/* 子分類：活動時段 */}
        {!isLoading && sortMode === "activeTime" && (
          <div className="flex gap-2 mb-6 text-xs">
            {[
              { label: "凌晨", value: "midnight" },
              { label: "早上", value: "morning" },
              { label: "下午", value: "afternoon" },
              { label: "晚上", value: "evening" },
            ].map(({ label, value }) => (
              <button
                key={value}
                className={`px-3 py-1 rounded-full border ${activeTimePeriod === value
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-600 border-gray-300"
                  }`}
                onClick={() => setActiveTimePeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ✅ 結果清單 */}
        {!isLoading && channels.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-gray-700 mb-3">全部頻道</h2>
            <p className="text-xs text-gray-400 mb-3">
              {sortMode === "alphabetical"
                ? "按照頻道名稱字典順序排列"
                : sortMode === "activeTime"
                  ? `依照「${{
                    midnight: "凌晨",
                    morning: "早上",
                    afternoon: "下午",
                    evening: "晚上"
                  }[activeTimePeriod]}」的活躍度排列`
                  : "按照最近上片時間排列"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {channels.map((channel) => (
                <ChannelSelectorCard
                  key={channel.channel_id}
                  channel={channel}
                  onClick={handleClick}
                />
              ))}
            </div>
          </>
        )}

        {!isLoading && channels.length === 0 && (
          <div className="text-center text-gray-500 mt-10">查無符合的頻道</div>
        )}
      </div>
    </MainLayout>
  );
};

export default ChannelSelectorPage;
