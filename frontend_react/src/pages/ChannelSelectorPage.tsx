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

const MAIN_COLOR_CLASS = {
  talkRatio: "bg-emerald-500 text-white",
  gameRatio: "bg-indigo-500 text-white",
  musicRatio: "bg-orange-400 text-white",
  showRatio: "bg-yellow-400 text-yellow-900",
};

const MAIN_PALE_CLASS = {
  talkRatio: "bg-emerald-100 text-emerald-800",
  gameRatio: "bg-indigo-100 text-indigo-800",
  musicRatio: "bg-orange-100 text-orange-800",
  showRatio: "bg-yellow-100 text-yellow-800",
};

const ChannelSelectorPage = () => {
  const [searchText, setSearchText] = useState("");
  type SortMode = "latest" | "alphabetical" | "activeTime" | "talkRatio" | "gameRatio" | "musicRatio" | "showRatio";
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  const [isFlagGrouping, setIsFlagGrouping] = useState(() =>
    localStorage.getItem("useFlagGrouping") === "true"
  );

  const navigate = useNavigate();

  const hookSortMode = (sortMode === "alphabetical" || sortMode === "activeTime") ? sortMode : "latest";
  const {
    isLoading,
    channels,
    newlyJoinedChannels,
    totalRegisteredCount,
    error,
  } = useSelectableChannelList(searchText, hookSortMode);

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
  } else if (sortMode === "talkRatio") {
    sortFn = (a, b) => {
      const getRatio = (c) =>
        c.category_counts?.all
          ? (c.category_counts.talk || 0) / c.category_counts.all
          : 0;
      return getRatio(b) - getRatio(a);
    };
  } else if (sortMode === "gameRatio") {
    sortFn = (a, b) => {
      const getRatio = (c) =>
        c.category_counts?.all
          ? (c.category_counts.game || 0) / c.category_counts.all
          : 0;
      return getRatio(b) - getRatio(a);
    };
  } else if (sortMode === "musicRatio") {
    sortFn = (a, b) => {
      const getRatio = (c) =>
        c.category_counts?.all
          ? (c.category_counts.music || 0) / c.category_counts.all
          : 0;
      return getRatio(b) - getRatio(a);
    };
  } else if (sortMode === "showRatio") {
    sortFn = (a, b) => {
      const getRatio = (c) =>
        c.category_counts?.all
          ? (c.category_counts.show || 0) / c.category_counts.all
          : 0;
      return getRatio(b) - getRatio(a);
    };
  }
  sortedChannels.sort(sortFn);

  const groupedChannels = isFlagGrouping
    ? groupChannelsByCountry(sortedChannels, sortFn)
    : [];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          頻道列表
        </h1>

        {/* 🔍 搜尋欄 */}
        <input
          type="text"
          placeholder="輸入頻道名稱..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 mb-4"
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
              : "bg-white text-gray-600 border-gray-300 dark:bg-zinc-800 dark:text-gray-200 dark:border-zinc-600"
              }`}
            onClick={() => setSortMode("latest")}
          >
            最新上片
          </button>
          <button
            className={`px-3 py-1 rounded-lg border ${sortMode === "activeTime"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300 dark:bg-zinc-800 dark:text-gray-200 dark:border-zinc-600"
              }`}
            onClick={() => setSortMode("activeTime")}
          >
            活動時間
          </button>
          <button
            className={`px-3 py-1 rounded-lg border ${sortMode === "alphabetical"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300 dark:bg-zinc-800 dark:text-gray-200 dark:border-zinc-600"
              }`}
            onClick={() => setSortMode("alphabetical")}
          >
            字典排序
          </button>
          <button
            className={`px-3 py-1 rounded-lg border font-medium ${sortMode === "talkRatio"
              ? MAIN_COLOR_CLASS.talkRatio
              : MAIN_PALE_CLASS.talkRatio
              }`}
            onClick={() => setSortMode("talkRatio")}
          >
            雜談比例
          </button>
          <button
            className={`px-3 py-1 rounded-lg border font-medium ${sortMode === "gameRatio"
              ? MAIN_COLOR_CLASS.gameRatio
              : MAIN_PALE_CLASS.gameRatio
              }`}
            onClick={() => setSortMode("gameRatio")}
          >
            遊戲比例
          </button>
          <button
            className={`px-3 py-1 rounded-lg border font-medium ${sortMode === "musicRatio"
              ? MAIN_COLOR_CLASS.musicRatio
              : MAIN_PALE_CLASS.musicRatio
              }`}
            onClick={() => setSortMode("musicRatio")}
          >
            音樂比例
          </button>
          <button
            className={`px-3 py-1 rounded-lg border font-medium ${sortMode === "showRatio"
              ? MAIN_COLOR_CLASS.showRatio
              : MAIN_PALE_CLASS.showRatio
              }`}
            onClick={() => setSortMode("showRatio")}
          >
            節目比例
          </button>
        </div>

        {/* ❌ 錯誤狀態 */}
        {error && (
          <div className="text-red-600 dark:text-red-400 font-semibold mb-4">
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
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
              公開頻道（{channels.length}）{totalRegisteredCount > 0 && (
                <span className="font-normal text-gray-400 dark:text-gray-500">
                  ／共 {totalRegisteredCount} 位創作者登記
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              分類比例總和可能超過 100%，因為同一部影片可能同時屬於多個分類。且未分類的影片會在計數中被排除。
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              {sortMode === "alphabetical"
                ? "按照頻道名稱字典順序排列"
                : "按照最近上片時間排列"}
            </p>

            {isFlagGrouping ? (
              <GroupedChannelList
                groupedChannels={groupedChannels}
                onClick={handleClick}
                renderCard={undefined}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedChannels.map((channel) => (
                  <ChannelSelectorCard
                    key={channel.channel_id}
                    channel={channel}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && !isActivityTab && channels.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            查無符合的頻道
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ChannelSelectorPage;
