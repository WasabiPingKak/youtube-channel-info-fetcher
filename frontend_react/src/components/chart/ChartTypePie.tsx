import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { getCategoryHex } from "@/utils/categoryColors";

interface ChartDataItem {
  category: string;
  [key: string]: unknown;
}

interface ChartTypePieProps {
  data: ChartDataItem[];
  dataKey: string;
  unit?: string;
  videos?: { videoId: string; duration?: number }[];
}

const FALLBACK_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#f97316",
  "#8b5cf6", "#ec4899", "#14b8a6", "#9ca3af",
];

const ChartTypePie = ({
  data,
  dataKey,
  unit = "部",
  videos = [],
}: ChartTypePieProps) => {
  const isDarkMode = document.documentElement.classList.contains("dark");

  const deduplicated = Array.from(
    new Map(videos.map((v) => [v.videoId, v])).values(),
  );

  const total =
    dataKey === "count"
      ? deduplicated.length
      : deduplicated.reduce((sum, v) => sum + (v.duration || 0), 0);

  const isEmpty =
    data.length === 0 ||
    data.every((d) => ((d[dataKey] as number) || 0) === 0);

  const renderTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartDataItem; value: number }>;
  }) => {
    if (active && payload && payload.length) {
      const { category } = payload[0].payload;
      const value = payload[0].value;
      const display = unit === "小時" ? value.toFixed(1) : value;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 px-3 py-1.5 text-sm rounded-lg shadow-lg">
          <span className="font-medium">{category}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-2">
            {display}
            {unit}
          </span>
        </div>
      );
    }
    return null;
  };

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500">
        尚無可供統計的資料
      </div>
    );
  }

  const centerLabel = `共 ${
    unit === "小時"
      ? (total / 3600).toFixed(1)
      : dataKey === "duration"
        ? Math.round(total / 60)
        : total
  } ${unit}`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          label={false}
          stroke="none"
        >
          {data.map((item, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getCategoryHex(item.category) || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
            />
          ))}
          <Label
            value={centerLabel}
            position="center"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              fill: isDarkMode ? "#d1d5db" : "#374151",
            }}
          />
        </Pie>
        <Tooltip
          content={renderTooltip as never}
          wrapperStyle={{ outline: "none" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ChartTypePie;
