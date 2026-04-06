import React, { useState } from "react";
import HeatmapTooltip from "./heatmap/HeatmapTooltip";
import SlotVideoModal from "./heatmap/SlotVideoModal";
import type { ClassifiedVideoItem } from "@/types/category";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_MARKS = [0, 6, 12, 18];

const formatHourLabel = (hour: number) => {
  const ampm = hour < 12 ? "AM" : "PM";
  let h = hour % 12;
  if (h === 0) h = 12;
  const hh = h.toString().padStart(2, "0");
  return `${hh}:00 ${ampm}`;
};

const getHeatLevelClass = (count: number, max: number) => {
  const ratio = count / max;
  if (ratio === 0) return "bg-gray-100 dark:bg-zinc-800";
  if (ratio <= 0.2) return "bg-indigo-100 dark:bg-indigo-950";
  if (ratio <= 0.4) return "bg-indigo-300 dark:bg-indigo-800";
  if (ratio <= 0.7) return "bg-indigo-400 dark:bg-indigo-600";
  return "bg-indigo-600 dark:bg-indigo-500";
};

interface HoverInfo {
  label: string;
  hour: number;
  videoIds: string[];
  count: number;
}

interface SelectedSlot {
  label: string;
  hour: number;
  videoIds: string[];
}

interface HeatmapData {
  matrix?: Record<string, Record<string, string[]>>;
}

interface HeatmapContainerProps {
  data: HeatmapData;
  maxCount: number;
  hoverInfo: HoverInfo | null;
  setHoverInfo: (info: HoverInfo | null) => void;
  videos: ClassifiedVideoItem[];
}

const HeatmapContainer = ({ data, maxCount, hoverInfo, setHoverInfo, videos }: HeatmapContainerProps) => {
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  return (
    <div
      className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4 relative"
      style={{ height: 520 }}
    >
      <div className="flex flex-col h-full">
        {/* 時區說明 */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          台灣時間 (GMT+8)
        </div>

        {/* header：星期標題 */}
        <div className="flex">
          <div className="w-20" />
          <div className="flex-1 grid grid-cols-7 gap-x-1">
            {WEEKDAYS.map((label) => (
              <div key={label} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* body：Y 軸 + 熱力格子 */}
        <div className="flex flex-1 mt-1 overflow-hidden">
          {/* Y 軸時間 */}
          <div className="w-20 flex flex-col text-xs text-gray-400 dark:text-gray-500">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className="flex-1 flex items-center justify-end pr-3"
              >
                {HOUR_MARKS.includes(i) ? formatHourLabel(i) : ""}
              </div>
            ))}
          </div>

          {/* 7×24 熱力格子 */}
          <div className="flex-1 grid grid-cols-7 grid-rows-24 gap-[2px]">
            {Array.from({ length: 24 }, (_, hour) =>
              WEEKDAYS.map((label, idx) => {
                const dayKey = DAY_KEYS[idx];
                const videoIds =
                  data.matrix?.[dayKey]?.[hour.toString()] || [];
                const count = videoIds.length;
                return (
                  <div
                    key={`${dayKey}_${hour}`}
                    className={`${getHeatLevelClass(
                      count,
                      maxCount
                    )} w-full h-full rounded-sm hover:ring-1 hover:ring-indigo-400 dark:hover:ring-indigo-500 transition cursor-pointer`}
                    onMouseEnter={() =>
                      setHoverInfo({ label, hour, videoIds, count })
                    }
                    onMouseLeave={() => setHoverInfo(null)}
                    onClick={() => {
                      if (videoIds.length === 0) return;
                      setSelectedSlot({ label, hour, videoIds });
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* 圖例 */}
        <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
          <span>少</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-zinc-800" />
          <div className="w-3 h-3 rounded-sm bg-indigo-100 dark:bg-indigo-950" />
          <div className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-800" />
          <div className="w-3 h-3 rounded-sm bg-indigo-400 dark:bg-indigo-600" />
          <div className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-indigo-500" />
          <span>多</span>
        </div>

        {/* hover tooltip */}
        {hoverInfo && (
          <HeatmapTooltip
            label={hoverInfo.label}
            hour={hoverInfo.hour}
            videoIds={hoverInfo.videoIds}
            videos={videos}
          />
        )}

        {/* 點擊開啟 modal */}
        {selectedSlot && (
          <SlotVideoModal
            label={selectedSlot.label}
            hour={selectedSlot.hour}
            videoIds={selectedSlot.videoIds}
            videos={videos}
            onClose={() => setSelectedSlot(null)}
          />
        )}
      </div>
    </div>
  );
};

export default HeatmapContainer;
