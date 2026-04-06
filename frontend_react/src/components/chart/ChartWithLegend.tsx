import React from "react";
import ChartTypePie from "./ChartTypePie";
import { getCategoryHex } from "@/utils/categoryColors";

interface ChartDataItem {
  category: string;
  [key: string]: unknown;
}

const FALLBACK_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#f97316",
  "#8b5cf6", "#ec4899", "#14b8a6", "#9ca3af",
];

interface ChartWithLegendProps {
  data?: ChartDataItem[];
  dataKey: string;
  unit?: string;
  videos?: { videoId: string; duration?: number }[];
  onCategoryClick?: (category: string) => void;
}

const ChartWithLegend = ({
  data = [],
  dataKey,
  unit = "部",
  videos = [],
  onCategoryClick,
}: ChartWithLegendProps) => {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-zinc-600 rounded-lg">
        尚無可供統計的資料
      </div>
    );
  }

  const total = safeData.reduce(
    (sum, d) => sum + ((d[dataKey] as number) || 0),
    0,
  );

  const fmt = (val: number) =>
    unit.trim() === "小時" ? Number(val).toFixed(1) : val;

  return (
    <div className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* 甜甜圈圖 */}
        <div className="flex-shrink-0 w-full sm:w-[45%] max-w-[260px]">
          <ChartTypePie
            data={safeData}
            dataKey={dataKey}
            unit={unit}
            videos={videos}
          />
        </div>

        {/* 圖例 */}
        <div className="w-full space-y-1">
          {safeData.map((item, idx) => {
            const value = (item[dataKey] as number) || 0;
            const percent =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            const color =
              getCategoryHex(item.category as string) ||
              FALLBACK_COLORS[idx % FALLBACK_COLORS.length];

            return (
              <div
                key={idx}
                className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm ${
                  onCategoryClick
                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                    : ""
                }`}
                onClick={() => onCategoryClick?.(item.category as string)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {fmt(value)}
                    {unit}
                  </span>
                  <span className="w-12 text-right">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChartWithLegend;
