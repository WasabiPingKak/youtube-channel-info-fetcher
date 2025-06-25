import React, { useState } from "react";
import ActiveHeatScoreModal from "./ActiveHeatScoreModal";

const WEEKDAYS = [
  { label: "日", key: "Sun" },
  { label: "一", key: "Mon" },
  { label: "二", key: "Tue" },
  { label: "三", key: "Wed" },
  { label: "四", key: "Thu" },
  { label: "五", key: "Fri" },
  { label: "六", key: "Sat" },
];

const TIME_PERIODS = [
  { label: "凌晨", key: "midnight" },
  { label: "早上", key: "morning" },
  { label: "下午", key: "afternoon" },
  { label: "晚上", key: "evening" },
];

export default function ActiveTimeFilterPanel({
  selectedWeekdays,
  setSelectedWeekdays,
  selectedPeriods,
  setSelectedPeriods,
  resultCount,
}) {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const toggle = (list, setter, key) => {
    setter((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearFilter = () => {
    setSelectedWeekdays([]);
    setSelectedPeriods([]);
  };

  return (
    <div className="border p-4 rounded-xl bg-white dark:bg-zinc-800 space-y-3">
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map(({ label, key }) => {
          const active = selectedWeekdays.includes(key);
          return (
            <button
              key={key}
              className={`px-3 py-1 rounded border flex items-center gap-1 transition ${active
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-100 border-gray-300"
                }`}
              onClick={() => toggle(selectedWeekdays, setSelectedWeekdays, key)}
            >
              <input type="checkbox" readOnly checked={active} />
              {label}
            </button>
          );
        })}
      </div>

      <hr className="border-t border-gray-300 dark:border-zinc-600 my-2 w-full" />

      <div className="flex flex-wrap gap-2">
        {TIME_PERIODS.map(({ label, key }) => {
          const active = selectedPeriods.includes(key);
          return (
            <button
              key={key}
              className={`px-3 py-1 rounded border flex items-center gap-1 transition ${active
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-100 border-gray-300"
                }`}
              onClick={() => toggle(selectedPeriods, setSelectedPeriods, key)}
            >
              <input type="checkbox" readOnly checked={active} />
              {label}
            </button>
          );
        })}
      </div>

      <hr className="border-t border-gray-300 dark:border-zinc-600 my-2 w-full" />

      <div className="flex flex-col items-start gap-1">
        <div className="flex justify-end mb-4">
          <button
            onClick={clearFilter}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500 rounded px-3 py-1 hover:bg-red-50 dark:hover:bg-red-900 transition"
          >
            🗑️ 清除條件
          </button>
        </div>
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-sm text-blue-600 underline cursor-pointer"
        >
          活躍度說明
        </button>
      </div>

      <ActiveHeatScoreModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}
