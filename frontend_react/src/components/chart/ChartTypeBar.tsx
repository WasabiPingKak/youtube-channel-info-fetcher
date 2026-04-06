import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getCategoryHex } from "@/utils/categoryColors";

interface ChartDataItem {
  category: string;
  [key: string]: unknown;
}

interface ChartTypeBarProps {
  data: ChartDataItem[];
  dataKey: string;
}

const FALLBACK_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#f97316",
  "#8b5cf6", "#ec4899", "#14b8a6", "#9ca3af",
];

const ChartTypeBar = ({ data, dataKey }: ChartTypeBarProps) => {
  const isDarkMode = document.documentElement.classList.contains("dark");

  return (
    <div className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: isDarkMode ? "#9ca3af" : "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: isDarkMode ? "#9ca3af" : "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDarkMode ? "#27272a" : "#fff",
              border: `1px solid ${isDarkMode ? "#3f3f46" : "#e5e7eb"}`,
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((item, index) => (
              <Cell
                key={`bar-${index}`}
                fill={
                  getCategoryHex(item.category) ||
                  FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartTypeBar;
