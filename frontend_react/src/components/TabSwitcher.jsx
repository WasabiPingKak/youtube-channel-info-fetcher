import React from "react";

export default function TabSwitcher({ activeTab, setActiveTab }) {
  const tabs = ["live", "video", "shorts"];

  return (
    <div className="flex space-x-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded ${
            activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          {tab === "live" && "📺 直播"}
          {tab === "video" && "🎞️ 影片"}
          {tab === "shorts" && "📱 Shorts"}
        </button>
      ))}
    </div>
  );
}