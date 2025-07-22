import React, { useState } from "react";
import { useLiveRedirectData } from "@/hooks/useLiveRedirectData";
import FilterPanel from "@/components/live_redirect/FilterPanel";
import LiveRedirectSection from "@/components/live_redirect/LiveRedirectSection";
import MainLayout from "../components/layout/MainLayout";
import FlagGroupingToggle from "@/components/channels/FlagGroupingToggle";
import LiveRedirectHelpModal from "@/components/live_redirect/LiveRedirectHelpModal";
import { PiAirplaneLandingFill } from "react-icons/pi";
import { FaInfoCircle } from "react-icons/fa";
import LiveTopicFilterPanel from "@/components/live_redirect/LiveTopicFilterPanel";
import { getLiveTopicStats } from "@/utils/topicStats";
import { getBadgesFromLiveChannel } from "@/utils/badgeUtils";

export default function LiveRedirectPage() {
  const { data, isLoading, isError } = useLiveRedirectData();

  const [groupByCountry, setGroupByCountry] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [sortMode, setSortMode] = useState("time"); // "time" | "viewers"
  const [sortAsc, setSortAsc] = useState(true); // true = 遞增

  const [selectedTopics, setSelectedTopics] = useState([]); // 主題過濾選項
  const [collapseUpcoming, setCollapseUpcoming] = useState(false);

  React.useEffect(() => {
    if (data) {
      console.log("[Page] 分類結果", {
        upcoming: data.upcoming.map((c) => c.live.videoId),
        live: data.live.map((c) => c.live.videoId),
        ended: data.ended.map((c) => c.live.videoId),
      });
    }
  }, [data]);

  const topicStats = data ? getLiveTopicStats([...data.live, ...data.upcoming]) : {};

  const filterByTopic = (channels) => {
    if (selectedTopics.length === 0) return channels;

    return channels.filter((ch) => {
      try {
        const channelId = ch.channelId || ch.channel_id;
        if (!ch?.live || !channelId) {
          console.warn("[filterByTopic] ⛔ 缺少 live 或 channelId", ch);
          return false;
        }

        const badges = getBadgesFromLiveChannel(ch);
        const topics = new Set(badges.map((b) => b.main));
        return selectedTopics.some((topic) => topics.has(topic));
      } catch (error) {
        console.error("[filterByTopic] ❌ 錯誤:", error, ch);
        return false;
      }
    });
  };

  if (isLoading || isError || !data) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {isLoading && <div className="text-gray-500 dark:text-gray-300">載入中...</div>}
          {isError && <div className="text-red-600 dark:text-red-400">資料載入失敗，請稍後再試。</div>}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <PiAirplaneLandingFill className="w-6 h-6 " />
          降落轉機塔臺
        </h1>

        {/* 說明按鈕 */}
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-2 px-4 py-2 mb-4 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
          <span className="inline-block w-5 h-5 text-gray-600 dark:text-gray-300">
            <FaInfoCircle className="w-5 h-5" />
          </span>
          <span className="underline">誰會出現在這裡？</span>
        </button>

        <LiveRedirectHelpModal open={showHelp} onClose={() => setShowHelp(false)} />

        {/* 分組控制切換 */}
        <FlagGroupingToggle
          isEnabled={groupByCountry}
          onToggle={setGroupByCountry}
        />

        {/* 篩選條件控制面板（保留 showEnded，但已移除 showUpcoming） */}
        <FilterPanel
          showUpcoming={true}
          setShowUpcoming={() => { }} // 無作用
          groupByCountry={groupByCountry}
          setGroupByCountry={setGroupByCountry}
          showEnded={showEnded}
          setShowEnded={setShowEnded}
        />

        {/* 主題過濾面板 */}
        <LiveTopicFilterPanel
          selectedTopics={selectedTopics}
          setSelectedTopics={setSelectedTopics}
          topicStats={topicStats}
        />

        {/* 排序控制區塊 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 mb-6 text-sm font-medium">
          <div className="flex gap-2 items-center mb-2 sm:mb-0">
            <span className="text-gray-700 dark:text-gray-300">排序依據：</span>
            <button
              onClick={() => setSortMode("time")}
              className={`px-3 py-1 rounded-lg border ${sortMode === "time"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-600"
                }`}
            >
              開播時間
            </button>
            <button
              onClick={() => setSortMode("viewers")}
              className={`px-3 py-1 rounded-lg border ${sortMode === "viewers"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-600"
                }`}
            >
              觀看人數
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-gray-700 dark:text-gray-300">排序方向：</span>
            <button
              onClick={() => setSortAsc(true)}
              className={`px-3 py-1 rounded-lg border ${sortAsc
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-600"
                }`}
            >
              ⬆️ 遞增
            </button>
            <button
              onClick={() => setSortAsc(false)}
              className={`px-3 py-1 rounded-lg border ${!sortAsc
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-600"
                }`}
            >
              ⬇️ 遞減
            </button>
          </div>
        </div>

        {/* 即將直播（改為可收合灰色背景區塊） */}
        {filterByTopic(data.upcoming).length > 0 && (
          <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 mb-8 shadow-sm">
            <LiveRedirectSection
              title="⏰ 即將直播"
              type="upcoming"
              channels={filterByTopic(data.upcoming)}
              groupByCountry={groupByCountry}
              sortMode={sortMode}
              sortAsc={sortAsc}
              collapsible
              collapsed={collapseUpcoming}
              onToggleCollapse={() => setCollapseUpcoming(prev => !prev)}
            />
          </div>
        )}

        {/* 降落目標 */}
        {filterByTopic(data.live).length > 0 && (
          <LiveRedirectSection
            title="🪂 降落目標"
            type="live"
            channels={filterByTopic(data.live)}
            groupByCountry={groupByCountry}
            sortMode={sortMode}
            sortAsc={sortAsc}
          />
        )}

        {/* 已收播 */}
        {showEnded && filterByTopic(data.ended).length > 0 && (
          <LiveRedirectSection
            title="📁 已收播"
            type="ended"
            channels={filterByTopic(data.ended)}
            groupByCountry={groupByCountry}
            sortMode={sortMode}
            sortAsc={sortAsc}
          />
        )}
      </div>
    </MainLayout>
  );
}
