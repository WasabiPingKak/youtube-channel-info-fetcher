import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Label,
  Tooltip,
} from "recharts";
import { PieChart as PieIcon, AlertCircle } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface CategoryRatioCardProps {
  categoryTime: {
    category: string;
    seconds: number;
  }[];
}

const BASE_COLORS: Record<string, string> = {
  遊戲: "#6366f1", // Indigo
  雜談: "#10b981", // Emerald
  節目: "#f59e0b", // Amber
  音樂: "#ef4444", // Red
  未分類: "#64748b", // Slate
};

export default function CategoryRatioCard({
  categoryTime,
}: CategoryRatioCardProps) {
  // 1. 資料處理
  const allData = categoryTime.map((c) => ({
    category: c.category,
    hours: parseFloat((c.seconds / 3600).toFixed(1)),
  }));

  const uncategorized = allData.find((item) => item.category === "未分類");
  const categorized = allData
    .filter((item) => item.category !== "未分類")
    .sort((a, b) => b.hours - a.hours);

  const data = uncategorized ? [...categorized, uncategorized] : categorized;
  const total = data.reduce((sum, item) => sum + item.hours, 0);
  const isEmpty = data.length === 0 || data.every((d) => d.hours === 0);

  const uncategorizedPercent = uncategorized && total > 0
    ? (uncategorized.hours / total) * 100
    : 0;

  // 🚀 依據總數決定字級，避免破千時撞到圓環邊緣
  const centerFontSize = total >= 1000 ? "text-3xl" : "text-4xl";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = ({ active, payload }: any): React.ReactElement | null => {
    if (active && payload?.length) {
      const { category, hours } = payload[0].payload as { category: string; hours: number };
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="text-xs font-bold text-slate-500 uppercase mb-1">{category}</div>
          <div className="text-xl font-black text-slate-900 dark:text-white leading-none">
            {hours.toFixed(1)} <span className="text-xs font-bold text-slate-400">小時</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <StatCardWrapper delay={0.1} className="h-full">
      <div className="flex flex-col h-full space-y-8 p-1">

        {/* --- 標題區 --- */}
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
            <PieIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">
              直播內容分佈
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              基於影片標籤的分類時長統計
            </div>
          </div>
        </div>

        {/* --- 主內容區 --- */}
        <div className="flex-1 flex flex-col lg:flex-row gap-10 items-center justify-center">
          {isEmpty ? (
            <div className="text-slate-500 text-base font-medium py-10">尚無可供統計的資料</div>
          ) : (
            <>
              {/* 左側：圓餅圖 */}
              <div className="w-full lg:w-1/2 h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="hours"
                      nameKey="category"
                      innerRadius={80}
                      outerRadius={115}
                      paddingAngle={4}
                      stroke="none"
                      cx="50%"
                      cy="50%"
                    >
                      {data.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={BASE_COLORS[entry.category] ?? "#94a3b8"}
                          className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                        />
                      ))}

                      {/* 🚀 中心雙層標籤優化位移 */}
                      <Label
                        content={({ viewBox }) => {
                          const { cx, cy } = viewBox as { cx?: number; cy?: number };
                          return (
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={cx}
                                dy="-1.2em"
                                className="fill-slate-500 dark:fill-slate-400 text-xs font-bold uppercase tracking-widest"
                              >
                                總直播時數
                              </tspan>
                              <tspan
                                x={cx}
                                dy="1.0em"
                                className={`fill-slate-900 dark:fill-white ${centerFontSize} font-black tracking-tighter`}
                              >
                                {total.toFixed(1)}
                                <tspan className="text-xs font-bold ml-1 fill-slate-500 dark:fill-slate-400"> 小時</tspan>
                              </tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                    <Tooltip content={renderTooltip} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 右側：視覺化清單 */}
              <div className="w-full lg:w-1/2 space-y-5">
                {data.map((item, idx) => {
                  const percent = total > 0 ? (item.hours / total) * 100 : 0;
                  const isUncategorized = item.category === "未分類";
                  const color = BASE_COLORS[item.category] ?? "#94a3b8";

                  return (
                    <div key={idx} className="group space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                            {isUncategorized ? "類別未知" : item.category}
                          </span>
                          {isUncategorized && uncategorizedPercent > 15 && (
                            <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                          )}
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                          {item.hours.toFixed(1)} <span className="text-xs font-bold text-slate-500">小時</span>
                        </div>
                      </div>

                      <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* --- 底部備註 --- */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-5">
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium italic">
            * 統計包含所有分類直播。若單部影片具備多個標籤，時數將重複計算於各分類中。
            {uncategorizedPercent > 15 && (
              <span className="block text-amber-500 mt-1 font-bold not-italic">
                ⚠️ 您有超過 15% 的影片未分類，這可能會影響年度統計的精準度。
              </span>
            )}
          </p>
        </div>
      </div>
    </StatCardWrapper>
  );
}