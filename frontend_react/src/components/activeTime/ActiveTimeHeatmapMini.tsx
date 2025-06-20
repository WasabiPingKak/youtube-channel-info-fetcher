import React from "react";

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

// 遮罩樣式
const MASK_COLOR = "bg-black";
const MASK_OPACITY = "opacity-45"; // 值越大遮罩越深

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

function getHeatLevelClass(count: number, max: number) {
  const ratio = max === 0 ? 0 : count / max;
  if (ratio === 0) return "bg-gray-100";
  if (ratio <= 0.2) return "bg-purple-100";
  if (ratio <= 0.4) return "bg-purple-300";
  if (ratio <= 0.7) return "bg-purple-500";
  return "bg-purple-700";
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
  const highlightEnabled = highlightWeekdays.length > 0 || highlightPeriods.length > 0;

  return (
    <div className="text-[10px] text-gray-600 w-full">
      {/* X 軸：星期 */}
      <div className="ml-[32px] grid grid-cols-7 gap-[1px] mb-[2px]">
        {WEEKDAYS_LABEL.map((label) => (
          <div key={label} className="text-center text-xs text-gray-500">
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
              className={`pr-1 text-right leading-[6px] ${i % 6 === 0 ? "" : "text-transparent"}`}
            >
              {label}
            </div>
          ))}
        </div>
        {/* Heatmap 主體 */}
        <div className="grid grid-cols-7 grid-rows-24 gap-[1px] h-[160px] border border-gray-200 rounded overflow-hidden bg-white">
          {HOUR_ORDER.map((hourStr) =>
            WEEKDAYS_KEY.map((day) => {
              const hour = parseInt(hourStr, 10);
              const count = activeTime?.[day]?.[hourStr] || 0;
              const levelClass = getHeatLevelClass(count, max);
              const highlight = isHighlightedCell(day, hour, highlightWeekdays, highlightPeriods);

              return (
                <div
                  key={`${day}-${hour}`}
                  className={`relative ${levelClass}`}
                  title={`${day} ${hour}:00 - ${count} activities`}
                  style={{ width: "100%", height: "100%" }}
                >
                  {/* 遮罩，只在啟用篩選時且不是 highlight 區域時顯示 */}
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
