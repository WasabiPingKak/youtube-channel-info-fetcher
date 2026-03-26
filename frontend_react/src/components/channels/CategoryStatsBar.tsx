import React from "react";

const COLORS = {
  talk: "bg-emerald-500 text-white",
  game: "bg-indigo-500 text-white",
  music: "bg-orange-400 text-white",
  show: "bg-yellow-400 text-yellow-900",
};

const LABELS = {
  talk: "雜談",
  game: "遊戲",
  music: "音樂",
  show: "節目",
};

/**
 * 顯示分類統計長條圖，左側分類名稱套用 Badge 樣式
 * @param {{ counts: { talk: number; game: number; music: number; show: number; all: number } }}
 */
export default function CategoryStatsBar({ counts }) {
  if (!counts || !counts.all || counts.all === 0) return null;

  const total = counts.all;

  const items = ["talk", "game", "music", "show"].map((key) => {
    const value = counts[key] || 0;
    const pct = value > 0 ? Math.max(1, Math.round((value / total) * 100)) : 0;
    return {
      key,
      label: LABELS[key],
      percent: pct,
      className: COLORS[key],
    };
  });

  return (
    <div className="mt-4 space-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">
      {items.map(({ key, label, percent, className }) => (
        <div key={key} className="flex items-center gap-2">
          {/* 標籤 Badge 樣式 */}
          <span
            className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
          >
            {label}
          </span>

          {/* 條狀比例圖 */}
          <div className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-sm overflow-hidden h-3">
            <div
              className={`${className.split(" ")[0]} h-full`} // 只取背景色 class
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* 百分比數字 */}
          <div className="w-10 text-right shrink-0">{percent}%</div>
        </div>
      ))}
    </div>
  );
}
