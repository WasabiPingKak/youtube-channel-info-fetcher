import React from "react";

const tabs = [
  { key: "live", label: "📺 直播" },
  { key: "videos", label: "🎞️ 影片" },
  { key: "shorts", label: "📱 Shorts" },
];

export default function EditTabSwitcher({ activeTab, onTabChange }) {
  return (
    <div className="flex space-x-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-1 rounded ${
            activeTab === tab.key ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
