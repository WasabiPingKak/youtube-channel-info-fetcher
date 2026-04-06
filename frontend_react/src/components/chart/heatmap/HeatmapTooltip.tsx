import React from "react";
import { createPortal } from "react-dom";

interface HeatmapTooltipProps {
  label: string;
  hour: number;
  count: number;
  x: number;
  y: number;
}

const formatHourLabel = (hour: number) => {
  const ampm = hour < 12 ? "上午" : "下午";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${ampm}${h}點`;
};

const HeatmapTooltip = ({ label, hour, count, x, y }: HeatmapTooltipProps) => {
  return createPortal(
    <div
      className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-lg shadow-lg text-xs
        bg-gray-800 text-gray-100 dark:bg-zinc-700 dark:text-gray-200"
      style={{
        left: x,
        top: y - 8,
        transform: "translate(-50%, -100%)",
      }}
    >
      <span className="font-medium">星期{label} {formatHourLabel(hour)}</span>
      <span className="mx-1.5 text-gray-400">·</span>
      <span>{count} 部影片</span>
    </div>,
    document.body,
  );
};

export default HeatmapTooltip;
