import React from "react";

const TABS = ["live", "video", "shorts"];

export const TabSwitcher = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-4 mb-4">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded ${
            activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
