// src/components/VideoExplorer/MobileSortDropdown.jsx
import React from "react";

const SORT_OPTIONS = [
  { value: "publishDate", label: "發布時間" },
  { value: "duration", label: "時長" },
  { value: "title", label: "標題" },
];

const MobileSortDropdown = ({
  sortField,
  sortOrder,
  onSortChange,
  onToggleOrder,
}) => {
  return (
    <div className="md:hidden px-4 mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        排序方式
      </label>
      <div className="flex items-center gap-2">
        <select
          value={sortField}
          onChange={(e) => onSortChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={onToggleOrder}
          className="border border-gray-300 rounded px-2 py-2 text-sm"
          title="切換升降序"
        >
          {sortOrder === "asc" ? "🔼" : "🔽"}
        </button>
      </div>
    </div>
  );
};

export default MobileSortDropdown;
