import React from "react";

export default function FilterPanel({
  showUpcoming,
  setShowUpcoming,
  showEnded,
  setShowEnded,
}) {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-6">
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={showUpcoming}
          onChange={(e) => setShowUpcoming(e.target.checked)}
        />
        顯示即將直播
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={showEnded}
          onChange={(e) => setShowEnded(e.target.checked)}
        />
        顯示已收播
      </label>
    </div>
  );
}
