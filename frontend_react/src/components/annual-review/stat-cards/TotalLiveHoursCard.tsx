import React, { useMemo } from "react";
import { Clock, Trophy } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface TotalLiveHoursCardProps {
  hours: number;
}

const getAnnualTitle = (hours: number) => {
  if (hours >= 1000) return { label: "傳奇級", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
  if (hours >= 500) return { label: "年度高產", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (hours >= 100) return { label: "熱血創作者", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  return { label: "持續耕耘", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" };
};

export default function TotalLiveHoursCard({ hours }: TotalLiveHoursCardProps) {
  const averagePerWeek = hours / 52;
  const titleInfo = useMemo(() => getAnnualTitle(hours), [hours]);

  // 🚀 優化：針對大數值動態調整字型大小，避免換行
  const mainValueSize = hours >= 1000 ? "text-4xl" : "text-5xl";

  return (
    <StatCardWrapper delay={0}>
      <div className="group relative flex items-center gap-5 p-3 transition-all">
        {/* Icon 容器 */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 dark:ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1.5">
            <div className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-black tracking-tighter uppercase border ${titleInfo.bg} ${titleInfo.color} ${titleInfo.border}`}>
              <Trophy size={12} />
              {titleInfo.label}
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              總直播時數
            </div>
          </div>

          {/* 🚀 修正：加上 whitespace-nowrap 確保單位不掉下去 */}
          <div className="flex items-baseline gap-1 whitespace-nowrap overflow-hidden">
            <span className={`${mainValueSize} font-black tracking-tighter bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-500 bg-clip-text text-transparent leading-none`}>
              {hours.toFixed(1)}
            </span>
            <span className="text-base font-bold text-slate-600 dark:text-slate-400">小時</span>
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
            <span>平均每週</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-base tracking-tight mx-0.5">
              {averagePerWeek.toFixed(1)}
            </span>
            <span>小時</span>
          </div>
        </div>
      </div>
    </StatCardWrapper>
  );
}