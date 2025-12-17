import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import SimpleTooltipWithColor from "./SimpleTooltipWithColor";

interface MonthlyBarChartProps {
  chartData: any[];
  dataKeys: string[];
  colorMap: Record<string, string>;
  nameMap?: Record<string, string>;
  xKey: string;
  yUnit?: string;
  stacked?: boolean;
  height?: number;
  chartTitle?: string;
}

const MonthlyBarChart = ({
  chartData,
  dataKeys,
  colorMap,
  nameMap,
  xKey,
  yUnit = "",
  stacked = false,
  height = 500,
  chartTitle,
}: MonthlyBarChartProps) => {
  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const tickColor = isDark ? "#ddd" : "#000";
  const tooltipBg = isDark ? "#1f2937" : "#fff";

  return (
    <div className="w-full">
      {chartTitle && (
        <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
          {chartTitle}
        </h3>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <XAxis
              dataKey={xKey}
              tick={{ fill: tickColor }}
              tickFormatter={(v) => `${v}月`}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: tickColor }}
            />
            <Tooltip
              content={<SimpleTooltipWithColor yUnit={yUnit} />}
              wrapperStyle={{ backgroundColor: tooltipBg }}
            />
            <Legend />
            {dataKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                name={nameMap?.[key] || key}
                stackId={stacked ? "stack" : undefined}
                fill={colorMap[key]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyBarChart;