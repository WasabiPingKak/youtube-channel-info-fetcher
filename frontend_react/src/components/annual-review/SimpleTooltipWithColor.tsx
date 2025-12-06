import React from "react";

interface SimpleTooltipWithColorProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  yUnit?: string; // ex: "部", "小時"
}

const SimpleTooltipWithColor = ({ active, payload, label, yUnit }: SimpleTooltipWithColorProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded shadow-md p-3 text-sm max-w-xs text-gray-800 dark:text-gray-100">
      {/* 月份標題 */}
      <div className="font-bold mb-2">📅 {label} 月</div>

      {/* 每個類別項目 */}
      <ul className="space-y-1">
        {payload.map((entry) => {
          const key = entry.dataKey;
          const value = entry.value;
          const color = entry.color;

          return (
            <li key={key} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              <span className="font-medium" style={{ color }}>
                {key}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ：{value} {yUnit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SimpleTooltipWithColor;