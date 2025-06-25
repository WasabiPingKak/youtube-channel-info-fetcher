import React, { useEffect, useState } from "react";

const WEEKDAYS_LABEL = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAYS_KEY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_ORDER = Array.from({ length: 24 }, (_, i) => i.toString());
const HOUR_LABELS = HOUR_ORDER.map((h) => `${h.padStart(2, "0")}:00`);

const TIME_PERIODS: Record<string, number[]> = {
  midnight: [0, 1, 2, 3, 4, 5],
  morning: [6, 7, 8, 9, 10, 11],
  afternoon: [12, 13, 14, 15, 16, 17],
  evening: [18, 19, 20, 21, 22, 23],
};

const MASK_COLOR = "bg-black";
const MASK_OPACITY = "opacity-45";

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(match.matches);
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    match.addEventListener("change", listener);
    return () => match.removeEventListener("change", listener);
  }, []);

  return isDark;
}

function getMaxCount(activeTime: Record<string, Record<string, number>>) {
  let max = 0;
  for (const day of WEEKDAYS_KEY) {
    const dayData = activeTime?.[day] || {};
    for (const h of HOUR_ORDER) {
      const count = dayData?.[h] || 0;
      if (count > max) max = count;
    }
  }
  return max;
}

// 修改這個函數，讓它回傳顏色值而不是 class 名稱
function getLightModeColor(count: number, max: number): string {
  const ratio = max === 0 ? 0 : count / max;
  if (ratio === 0) return "#f3f4f6";      // bg-gray-100
  if (ratio <= 0.2) return "#ede9fe";     // bg-purple-100
  if (ratio <= 0.4) return "#c4b5fd";     // bg-purple-300
  if (ratio <= 0.7) return "#8b5cf6";     // bg-purple-500
  return "#6d28d9";                       // bg-purple-700
}

function getDarkModeColor(count: number, max: number): string {
  const ratio = max === 0 ? 0 : count / max;
  if (ratio === 0) return "#161b22";
  if (ratio <= 0.25) return "#0e4429";
  if (ratio <= 0.5) return "#006d32";
  if (ratio <= 0.75) return "#26a641";
  return "#39d353";
}

function isHighlightedCell(
  day: string,
  hour: number,
  highlightWeekdays: string[],
  highlightPeriods: string[]
) {
  if (highlightWeekdays.length === 0 && highlightPeriods.length === 0) return false;

  const dayMatch = highlightWeekdays.includes(day);
  const periodMatch = Object.entries(TIME_PERIODS).some(
    ([key, hours]) => highlightPeriods.includes(key) && hours.includes(hour)
  );

  if (highlightWeekdays.length > 0 && highlightPeriods.length > 0) {
    return dayMatch && periodMatch;
  } else if (highlightWeekdays.length > 0) {
    return dayMatch;
  } else {
    return periodMatch;
  }
}

type Props = {
  activeTime: Record<string, Record<string, number>>;
  highlightWeekdays?: string[];
  highlightPeriods?: string[];
};

export default function ActiveTimeHeatmapMini({
  activeTime,
  highlightWeekdays = [],
  highlightPeriods = [],
}: Props) {
  const max = getMaxCount(activeTime);
  const isDark = useIsDarkMode();
  const highlightEnabled = highlightWeekdays.length > 0 || highlightPeriods.length > 0;

  // 模擬一些測試數據
  const testData = {
    Mon: { "0": 5, "8": 15, "14": 8, "20": 12 },
    Tue: { "9": 20, "13": 10, "19": 7 },
    Wed: { "10": 25, "15": 18, "21": 9 },
    Thu: { "7": 12, "12": 22, "18": 14 },
    Fri: { "11": 30, "16": 6, "22": 11 },
    Sat: { "13": 8, "17": 16, "23": 4 },
    Sun: { "14": 12, "19": 20, "1": 3 }
  };

  // 使用測試數據或傳入的數據
  const dataToUse = Object.keys(activeTime).length > 0 ? activeTime : testData;
  const maxCount = getMaxCount(dataToUse);

  console.log('isDark:', isDark); // 調試用

  return (
    <div className="text-[10px] text-gray-600 dark:text-gray-300 w-full">
      {/* 調試信息 */}
      <div className="mb-2 text-sm">
        <span>Dark Mode: {isDark ? '✅ 是' : '❌ 否'}</span>
        <button
          onClick={() => window.location.reload()}
          className="ml-4 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          重新載入測試
        </button>
      </div>
      {/* X 軸：星期 */}
      <div className="ml-[32px] grid grid-cols-7 gap-[1px] mb-[2px]">
        {WEEKDAYS_LABEL.map((label) => (
          <div key={label} className="text-center text-xs text-gray-500 dark:text-gray-400">
            {label}
          </div>
        ))}
      </div>

      {/* 主體：Y 軸 + heatmap */}
      <div className="grid grid-cols-[32px_1fr] gap-[1px]">
        {/* Y 軸 */}
        <div className="grid grid-rows-24 gap-[1px] h-[160px]">
          {HOUR_LABELS.map((label, i) => (
            <div
              key={label}
              className={`pr-1 text-right leading-[6px] ${i % 6 === 0 ? "text-gray-500 dark:text-gray-400" : "text-transparent"
                }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap 主體 */}
        <div className="grid grid-cols-7 grid-rows-24 gap-[1px] h-[160px] border border-gray-200 dark:border-zinc-600 rounded overflow-hidden bg-white dark:bg-zinc-800">
          {HOUR_ORDER.map((hourStr) =>
            WEEKDAYS_KEY.map((day) => {
              const hour = parseInt(hourStr, 10);
              const count = dataToUse?.[day]?.[hourStr] || 0;
              // 修改這裡：統一使用 backgroundColor
              const backgroundColor = isDark
                ? getDarkModeColor(count, maxCount)
                : getLightModeColor(count, maxCount);
              const highlight = isHighlightedCell(day, hour, highlightWeekdays, highlightPeriods);

              return (
                <div
                  key={`${day}-${hour}`}
                  className="relative"
                  title={`${day} ${hour}:00 - ${count} activities`}
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                  }}
                >
                  {highlightEnabled && !highlight && (
                    <div
                      className={`absolute inset-0 ${MASK_COLOR} ${MASK_OPACITY} pointer-events-none`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}