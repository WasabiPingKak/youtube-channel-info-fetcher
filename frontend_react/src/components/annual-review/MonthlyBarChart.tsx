import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface MonthlyBarChartProps {
  chartData: Record<string, string | number>[];
  dataKeys: string[];
  colorMap: Record<string, string>;
  nameMap?: Record<string, string>;
  xKey: string;
  yUnit?: string;
  stacked?: boolean;
  height?: number;
  chartTitle?: string;
}

/**
 * 🚀 自定義懸停提示元件：計算並顯示單月總和
 */
const CustomTooltip = ({ active, payload, label, yUnit }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  yUnit?: string;
}) => {
  if (active && payload && payload.length) {
    // 計算該月份所有項目的總和
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 min-w-[180px]">
        {/* 月份標題 */}
        <div className="mb-3 border-b border-slate-100 pb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:border-slate-800">
          {label}月數據回顧
        </div>

        {/* 各項目清單 */}
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {entry.value.toFixed(1)} <span className="text-[10px] font-medium text-slate-500">{yUnit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* 總計區塊 */}
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              單月總計
            </span>
            <span className="text-lg font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
              {total.toFixed(1)} <span className="text-[10px] font-bold uppercase">{yUnit}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * 🚀 自定義圖例元件：膠囊風格 Pills
 */
const CustomLegend = (props: { payload?: { value: string; color: string }[] }) => {
  const { payload } = props;
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const MonthlyBarChart = ({
  chartData,
  dataKeys,
  colorMap,
  nameMap,
  xKey,
  yUnit = "",
  stacked = false,
  height = 450,
  chartTitle,
}: MonthlyBarChartProps) => {
  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const tickColor = isDark ? "#64748b" : "#94a3b8"; // 亮色下調淡刻度顏色

  return (
    <div className="w-full">
      {chartTitle && (
        <h3 className="text-lg font-black mb-6 text-slate-900 dark:text-white flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          {chartTitle}
        </h3>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barSize={stacked ? 32 : 12} // 堆疊時柱子稍微加粗
          >
            {/* 網格設定：只保留水平線並淡化 */}
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke={isDark ? "#1e293b" : "#f1f5f9"}
            />

            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 12, fontWeight: 700 }}
              tickFormatter={(v) => `${v}月`}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
              dx={-10}
            />

            <Tooltip
              content={<CustomTooltip yUnit={yUnit} />}
              cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
            />

            <Legend content={<CustomLegend />} />

            {dataKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                name={nameMap?.[key] || key}
                stackId={stacked ? "stack" : undefined}
                fill={colorMap[key]}
                radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]} // 非堆疊時給予圓角
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyBarChart;