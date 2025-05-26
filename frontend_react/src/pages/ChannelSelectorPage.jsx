import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelectableChannelList } from "../hooks/useSelectableChannelList";
import MainLayout from "../components/layout/MainLayout";
import { addRecentChannel } from "../utils/recentChannels";
import {
  ChannelSelectorCard,
  RecentChannelsSection,
  NewlyJoinedChannelsSection,
} from "../components/channels";


const ChannelSelectorPage = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const { isLoading, channels, newlyJoinedChannels, error } = useSelectableChannelList(searchText);

  const handleClick = (channelId) => {
    addRecentChannel(channelId);
    navigate(`/videos?channel=${channelId}`);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">切換頻道</h1>

        {/* 🔍 搜尋欄 */}
        <input
          type="text"
          placeholder="輸入頻道名稱..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-6"
        />

        {/* ✅ 最近使用清單（只有搜尋為空時才顯示） */}
        {!isLoading && searchText === "" && (
          <>
            {/*
            <RecentChannelsSection
              channels={channels}
              onClick={handleClick}
            />
            */}
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

        {/* ✅ 結果清單 */}
        {!isLoading && channels.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-gray-700 mb-3">全部頻道</h2>
            <p className="text-xs text-gray-400 mb-3">
              按照頻道名稱字典順序排列
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
