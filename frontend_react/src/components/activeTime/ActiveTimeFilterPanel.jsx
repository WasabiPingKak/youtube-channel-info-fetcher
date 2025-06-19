import React from "react";

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
  selectedPeriods,
  onToggleWeekday,
  onTogglePeriod,
  onClear,
  resultCount,
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map(({ label, key }) => (
          <button
            key={key}
            className={`px-3 py-1 rounded-full border ${selectedWeekdays.includes(key)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"
              }`}
            onClick={() => onToggleWeekday(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {TIME_PERIODS.map(({ label, key }) => (
          <button
            key={key}
            className={`px-3 py-1 rounded-full border ${selectedPeriods.includes(key)
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-600 border-gray-300"
              }`}
            onClick={() => onTogglePeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onClear}
          className="text-sm text-gray-600 underline"
        >
          清除條件
        </button>
        <span className="text-sm text-gray-500">
          目前符合的頻道：{resultCount} 個
        </span>
      </div>
    </div>
  );
}
