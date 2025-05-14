// src/components/VideoExplorer/VideoTableHeader.jsx
import React from "react";

const headers = [
  { key: "title", label: "標題", className: "flex-1 min-w-[240px] max-w-[50%]" },
  { key: "publishDate", label: "發布時間", className: "basis-28" },
  { key: "duration", label: "時長", className: "basis-28" },
  { key: "game", label: "遊戲", className: "basis-28" },
  { key: "matchedKeywords", label: "關鍵字", className: "basis-40" },
];

const VideoTableHeader = ({ sortField, sortOrder, onSortChange }) => {
  const renderSortArrow = (key) => {
    if (sortField !== key) return null;
    return sortOrder === "asc" ? "▲" : "▼";
  };

  return (
    <div className="hidden md:flex px-4 py-2 text-xs text-gray-500 font-semibold border-b border-gray-200 select-none">
      {headers.map(({ key, label, className }) => (
        <div
          key={key}
          className={`cursor-pointer ${className}`}
          onClick={() => onSortChange(key)}
        >
          {label} {renderSortArrow(key)}
        </div>
      ))}

      <div className="w-1/12 text-right">🔗</div>
    </div>
  );
};

export default VideoTableHeader;
