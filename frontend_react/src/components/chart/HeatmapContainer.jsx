import React, { useState } from "react";
import HeatmapTooltip from "./heatmap/HeatmapTooltip";
import SlotVideoModal from "./heatmap/SlotVideoModal";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_MARKS = [0, 6, 12, 18];

const formatHourLabel = (hour) => {
  const ampm = hour < 12 ? "AM" : "PM";
  let h = hour % 12;
  if (h === 0) h = 12;
  const hh = h.toString().padStart(2, "0");
  return `${hh}:00 ${ampm}`;
};

const getHeatLevelClass = (count, max) => {
  const ratio = count / max;
  if (ratio === 0) return "bg-gray-100";
  if (ratio <= 0.2) return "bg-purple-100";
  if (ratio <= 0.4) return "bg-purple-300";
  if (ratio <= 0.7) return "bg-purple-500";
  return "bg-purple-700";
};

const HeatmapContainer = ({ data, maxCount, hoverInfo, setHoverInfo, videos }) => {
  const [selectedSlot, setSelectedSlot] = useState(null); // ← Modal 狀態

  return (
    <div
      className="bg-white shadow p-4 border border-gray-200 relative"
      style={{ height: 600 }}
    >
      <div className="flex flex-col h-full">
        {/* 說明文字：時區 */}
        <div className="text-sm text-gray-500 mb-1">
          時間皆為 <span className="font-medium text-gray-700">台灣時間 (GMT+8)</span>
        </div>

        {/* header：星期標題 */}
        <div className="flex">
          <div className="w-24" />
          <div className="flex-1 grid grid-cols-7 gap-x-2">
            {WEEKDAYS.map((label) => (
              <div key={label} className="text-center text-sm font-medium">
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* body：Y 軸 + 熱力格子 */}
        <div className="flex flex-1 mt-1 overflow-hidden">
          {/* Y 軸時間 */}
          <div className="w-24 flex flex-col text-sm text-gray-600">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className="flex-1 flex items-center justify-end pr-4"
              >
                {HOUR_MARKS.includes(i) ? formatHourLabel(i) : ""}
              </div>
            ))}
          </div>

          {/* 7×24 熱力格子 */}
          <div className="flex-1 grid grid-cols-7 grid-rows-24 gap-y-[2px] gap-x-2">
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
                    )} w-full h-full border border-white hover:brightness-110 transition`}
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
