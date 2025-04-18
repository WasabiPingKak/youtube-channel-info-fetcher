import React from "react";

export default function TopLevelTabs({ activeType, onTypeChange }) {
  if (typeof onTypeChange !== "function") {
    console.warn("[TopLevelTabs] 缺少 onTypeChange props，按鈕將無作用。");
  }

  const tabs = ["live", "videos", "shorts"];

  return (
    <div className="flex space-x-2 mb-4 px-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTypeChange && onTypeChange(tab)}
          className={`px-4 py-2 rounded ${
            activeType === tab ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          {tab === "live" && "📺 直播"}
          {tab === "videos" && "🎞️ 影片"}
          {tab === "shorts" && "📱 Shorts"}
        </button>
      ))}
    </div>
  );
}