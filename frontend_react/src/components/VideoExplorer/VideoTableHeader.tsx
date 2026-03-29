// src/components/VideoExplorer/VideoTableHeader.jsx
import React from "react";

const headers = [
  { key: "title", label: "標題", className: "flex-1 min-w-[240px] max-w-[50%]" },
  { key: "publishDate", label: "發布時間", className: "basis-28" },
  { key: "duration", label: "時長", className: "basis-28" },
  // 🔹 分類欄位不支援排序
  { key: null, label: "分類", className: "basis-56", disableSort: true },
];

interface VideoTableHeaderProps {
  sortField: string;
  sortOrder: "asc" | "desc";
  onSortChange: (field: string) => void;
}

const VideoTableHeader = ({ sortField, sortOrder, onSortChange }: VideoTableHeaderProps) => {
  const renderSortArrow = (key: string | null) => {
    if (sortField !== key) return null;
    return sortOrder === "asc" ? "▲" : "▼";
  };

  return (
    <div className="hidden md:flex px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-zinc-600 select-none">
      {headers.map(({ key, label, className, disableSort }) => (
        <div
          key={label}
          className={`${disableSort ? "cursor-default" : "cursor-pointer"
            } ${className}`}
          onClick={() => !disableSort && key && onSortChange(key)}
        >
          {label} {!disableSort && renderSortArrow(key)}
        </div>
      ))}

      <div className="w-1/12 text-right">🔗</div>
    </div>
  );
};

export default VideoTableHeader;
