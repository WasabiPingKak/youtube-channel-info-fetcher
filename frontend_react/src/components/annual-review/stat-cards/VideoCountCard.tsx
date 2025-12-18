import React from "react";
import { Film } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface VideoCountCardProps {
  counts: {
    shorts: number;
    videos: number;
    live: number;
  };
}

const LABELS = [
  { key: "live", label: "直播", color: "bg-red-500" },
  { key: "videos", label: "影片", color: "bg-blue-400" },
  { key: "shorts", label: "Shorts", color: "bg-pink-400" }
];

export default function VideoCountCard({ counts }: VideoCountCardProps) {
  return (
    <StatCardWrapper delay={0.1}>
      <div className="group relative flex items-center gap-6 p-3 transition-all h-full">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20 dark:ring-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <Film className="w-8 h-8" />
        </div>

        <div className="space-y-2.5 flex-1">
          <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            年度創作產出
          </div>
          <ul className="grid grid-cols-1 gap-2">
            {LABELS.map(({ key, label, color }) => (
              <li key={key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  {/* 標籤放大至 text-sm */}
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{label}</span>
                </div>
                {/* 數值放大至 text-base */}
                <span className="text-base font-black text-slate-900 dark:text-slate-200 tracking-tight">
                  {counts[key as keyof typeof counts]}
                  <span className="ml-1 text-xs font-medium text-slate-400 dark:text-slate-500">部</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StatCardWrapper>
  );
}