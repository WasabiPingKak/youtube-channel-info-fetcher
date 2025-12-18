import React from "react";
import { CalendarDays } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface TotalLiveDaysCardProps {
  days: number;
}

export default function TotalLiveDaysCard({ days }: TotalLiveDaysCardProps) {
  const averagePerWeek = days / 52;

  return (
    <StatCardWrapper delay={0.05}>
      <div className="group relative flex items-center gap-6 p-3 transition-all">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 dark:ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <CalendarDays className="w-8 h-8" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            總直播天數
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-blue-400 to-indigo-500 bg-clip-text text-transparent leading-none">
              {days}
            </span>
            <span className="text-base font-bold text-slate-600 dark:text-slate-400">天</span>
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>平均每週</span>
            <span className="font-black text-blue-600 dark:text-blue-400 text-base tracking-tight mx-0.5">
              {averagePerWeek.toFixed(1)}
            </span>
            <span>天</span>
          </div>
        </div>
      </div>
    </StatCardWrapper>
  );
}