import React from "react";
import { calcInclusiveDays, clampInt, formatDateWithWeekday } from "./utils";

interface StreakAxisProps {
  startDate?: string | null;
  endDate?: string | null;
  days?: number | null;
}

/**
 * 簡約版連續天數數軸
 * 風格：無背景，主色調線條
 */
export default function StreakAxis({
  startDate,
  endDate,
  days,
}: StreakAxisProps) {
  const derived = calcInclusiveDays(startDate, endDate);
  const n = derived ?? (typeof days === "number" ? Math.floor(days) : 0);
  const safeN = clampInt(n, 1, 3650);

  // 天數 > 60 時隱藏中間刻度，避免擁擠
  const showIntermediateTicks = safeN <= 60;

  const startText = formatDateWithWeekday(startDate);
  const endText = formatDateWithWeekday(endDate);

  if (safeN <= 0) return null;

  return (
    <div className="mt-2 w-full px-2 py-4">
      {/* 數軸主體區域 */}
      <div className="relative h-10 w-full">
        {/* 1. 主橫線 (基底，淡色) */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-border rounded-full" />

        {/* 2. 左端點刻度 (主色，強調) */}
        <div className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary rounded-full" />

        {/* 3. 右端點刻度 (主色，強調) */}
        <div className="absolute right-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary rounded-full" />

        {/* 4. 中間刻度 (半透明主色) */}
        {showIntermediateTicks && safeN > 1 && (
          <div className="absolute inset-0 mx-[1px]">
            {Array.from({ length: safeN - 2 }).map((_, i) => {
              const pct = ((i + 1) / (safeN - 1)) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 h-2 w-[1px] -translate-y-1/2 bg-primary/40"
                  style={{ left: `${pct}%` }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 底部日期文字：左右對齊 */}
      <div className="flex justify-between text-xs font-medium text-muted-foreground">
        <span className="-translate-x-1">{startText}</span>
        <span className="translate-x-1">{endText}</span>
      </div>
    </div>
  );
}