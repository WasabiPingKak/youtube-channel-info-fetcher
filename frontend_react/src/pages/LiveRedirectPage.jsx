import React, { useState } from "react";
import { useLiveRedirectData } from "@/hooks/useLiveRedirectData";
import FilterPanel from "@/components/live_redirect/FilterPanel";
import LiveRedirectSection from "@/components/live_redirect/LiveRedirectSection";
import MainLayout from "../components/layout/MainLayout";
import FlagGroupingToggle from "@/components/channels/FlagGroupingToggle";
import LiveRedirectHelpModal from "@/components/live_redirect/LiveRedirectHelpModal";
import { PiAirplaneLandingFill } from "react-icons/pi";
import { FaInfoCircle } from "react-icons/fa";

export default function LiveRedirectPage() {
  const { data, isLoading, isError } = useLiveRedirectData();

  const [showUpcoming, setShowUpcoming] = useState(true);
  const [groupByCountry, setGroupByCountry] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [sortMode, setSortMode] = useState("time"); // "time" | "viewers"
  const [sortAsc, setSortAsc] = useState(true); // true = 遞增

  React.useEffect(() => {
    if (data) {
      console.log("[Page] 分類結果", {
        upcoming: data.upcoming.map((c) => c.live.videoId),
        live: data.live.map((c) => c.live.videoId),
        ended: data.ended.map((c) => c.live.videoId),
      });
    }
  }, [data]);

  if (isLoading || isError || !data) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {isLoading && <div className="text-gray-500">載入中...</div>}
          {isError && <div className="text-red-600">資料載入失敗，請稍後再試。</div>}
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
          className="flex items-center gap-2 px-4 py-2 mb-4 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
        >
          <span className="inline-block w-5 h-5 text-gray-600">
            {/* 這裡你可以選用任何 icon，例如： */}
            <FaInfoCircle className="w-5 h-5 text-gray-600" />
          </span>
          <span className="underline">誰會出現在這裡？</span>
        </button>

        <LiveRedirectHelpModal open={showHelp} onClose={() => setShowHelp(false)} />

        {/* 分組控制切換 */}
        <FlagGroupingToggle
          isEnabled={groupByCountry}
          onToggle={setGroupByCountry}
        />

        <FilterPanel
          showUpcoming={showUpcoming}
          setShowUpcoming={setShowUpcoming}
          groupByCountry={groupByCountry}
          setGroupByCountry={setGroupByCountry}
          showEnded={showEnded}
          setShowEnded={setShowEnded}
        />

        {/* 排序控制區塊 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 mb-6 text-sm font-medium">
          {/* 排序依據 */}
          <div className="flex gap-2 items-center mb-2 sm:mb-0">
            <span className="text-gray-700">排序依據：</span>
            <button
              onClick={() => setSortMode("time")}
              className={`px-3 py-1 rounded-lg border ${sortMode === "time"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
                }`}
            >
              開播時間
            </button>
            <button
              onClick={() => setSortMode("viewers")}
              className={`px-3 py-1 rounded-lg border ${sortMode === "viewers"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
                }`}
            >
              觀看人數
            </button>
          </div>

          {/* 排序方向 */}
          <div className="flex gap-2 items-center">
            <span className="text-gray-700">排序方向：</span>
            <button
              onClick={() => setSortAsc(true)}
              className={`px-3 py-1 rounded-lg border ${sortAsc
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
                }`}
            >
              ⬆️ 遞增
            </button>
            <button
              onClick={() => setSortAsc(false)}
              className={`px-3 py-1 rounded-lg border ${!sortAsc
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
                }`}
            >
              ⬇️ 遞減
            </button>
          </div>
        </div>

        {showUpcoming && data.upcoming.length > 0 && (
          <LiveRedirectSection
            title="⏰ 即將直播"
            type="upcoming"
            channels={data.upcoming}
            groupByCountry={groupByCountry}
            sortMode={sortMode}
            sortAsc={sortAsc}
          />
        )}

        {data.live.length > 0 && (
          <LiveRedirectSection
            title="🪂 降落目標"
            type="live"
            channels={data.live}
            groupByCountry={groupByCountry}
            sortMode={sortMode}
            sortAsc={sortAsc}
          />
        )}

        {showEnded && data.ended.length > 0 && (
          <LiveRedirectSection
            title="📁 已收播"
            type="ended"
            channels={data.ended}
            groupByCountry={groupByCountry}
            sortMode={sortMode}
            sortAsc={sortAsc}
          />
        )}
      </div>
    </MainLayout>
  );
}
