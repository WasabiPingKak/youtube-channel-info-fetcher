// src/components/annual-review/AnnualReviewShareCard.tsx

import React, { useMemo } from "react";
import { formatDurationHM, formatDateTimeGMT8 } from "@/components/annual-review/utils";
import type { AnnualStatsSectionProps } from "@/components/annual-review/AnnualStatsSection";
import type { SpecialStatsData } from "@/utils/statistics/types";
import {
  Trophy,
  Calendar,
  Clock,
  Video,
  Gamepad2,
  Flame
} from "lucide-react";

interface AnnualReviewShareCardProps {
  year: number;
  channelName: string;
  channelAvatar?: string;
  stats: AnnualStatsSectionProps["stats"];
  special: SpecialStatsData;
}

/**
 * 🏆 年度稱號邏輯 (與網頁版保持一致，但針對分享圖微調顏色)
 */
const getAnnualTitle = (hours: number) => {
  if (hours >= 1000) return { label: "傳奇級", color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" };
  if (hours >= 500) return { label: "年度高產", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" };
  if (hours >= 100) return { label: "熱血創作者", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" };
  return { label: "持續耕耘", color: "text-slate-400", bg: "bg-slate-500/20", border: "border-slate-500/30" };
};

// 🛠️ 小工具：格式化日期範圍
function formatDateRange(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const yyyy = start.getFullYear();
  const mm1 = (start.getMonth() + 1).toString().padStart(2, '0');
  const dd1 = start.getDate().toString().padStart(2, '0');
  const mm2 = (end.getMonth() + 1).toString().padStart(2, '0');
  const dd2 = end.getDate().toString().padStart(2, '0');

  if (start.getFullYear() !== end.getFullYear()) {
    return `${yyyy}/${mm1}/${dd1} - ${end.getFullYear()}/${mm2}/${dd2}`;
  }
  return `${yyyy}/${mm1}/${dd1} - ${mm2}/${dd2}`;
}

export default function AnnualReviewShareCard({
  year,
  channelName,
  channelAvatar,
  stats,
  special,
}: AnnualReviewShareCardProps) {
  // 🎨 配色方案
  const styles = {
    cardBg: "bg-slate-950",
    textPrimary: "text-white",
    textSecondary: "text-slate-400",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 shadow-inner",
  };

  // 🧮 計算稱號與平均數據
  const titleInfo = useMemo(() => getAnnualTitle(stats.totalLiveHours), [stats.totalLiveHours]);
  const avgHoursPerWeek = (stats.totalLiveHours / 52).toFixed(1);
  const avgDaysPerWeek = (stats.totalLiveDays / 52).toFixed(1);

  const hasGames = special.topLiveGames && special.topLiveGames.length > 0;

  return (
    <div
      id="share-card-node"
      className={`relative w-[600px] h-[800px] ${styles.cardBg} ${styles.textPrimary} p-8 flex flex-col justify-between overflow-hidden shadow-2xl`}
      style={{ fontFamily: '"Noto Sans TC", sans-serif' }}
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* 1. Header */}
      <header className="relative z-10 flex items-center gap-4 mb-4">
        <h1 className="shrink-0 text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 drop-shadow-sm">
          {year}
        </h1>
        <div className="w-px h-10 bg-white/10 shrink-0" />
        {channelAvatar ? (
          <img
            src={channelAvatar}
            alt="avatar"
            className="w-12 h-12 rounded-full border-2 border-white/10 shadow-lg shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold border-2 border-white/10 shrink-0">
            {channelName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex flex-col justify-center text-left">
          <h2 className="font-bold text-lg leading-tight text-white line-clamp-2">
            {channelName}
          </h2>
          <p className={`text-sm ${styles.textSecondary}`}>Year in Review</p>
        </div>
      </header>

      {/* 2. Core Stats Grid */}
      <div className="relative z-10 grid grid-cols-6 grid-rows-[repeat(8,minmax(0,1fr))] gap-3 flex-1">

        {/* A. 總直播時數 (3x2) + ✨ 勳章徽章 */}
        <div className={`relative col-span-3 row-span-2 ${styles.glass} rounded-2xl p-4 flex flex-col justify-between group hover:bg-white/10 transition-colors`}>

          {/* 上半部：標題 + 徽章 */}
          {/* 💡 移除 flex-col 的 gap，改用子元素的 margin 確保截圖時座標固定 */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2 text-indigo-400">
              <Clock size={18} />
              <span className="text-sm font-bold tracking-wide">總直播時數</span>
            </div>

            {/* 🚀 關鍵修正點：
                1. 移除 backdrop-blur-md (截圖庫的大敵)
                2. 將背景顏色稍微加深 (bg-opacity 從 20 提高到 40) 以維持質感
                3. 增加 mt-1.5 替代原本父層的 gap
                4. 加入 leading-none 確保文字行高不干擾邊距計算
            */}
            <div className={`mt-1.5 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide w-fit shadow-sm leading-none whitespace-nowrap ${titleInfo.color} ${titleInfo.border.replace('30', '50')} bg-slate-900/40`}>
              <Trophy size={10} className="shrink-0" />
              <span className="inline-block pt-0.5">{titleInfo.label}</span>
            </div>
          </div>

          {/* 下半部：數值 */}
          <div className="text-left">
            <div className="text-4xl font-bold tracking-tight">
              {Math.floor(stats.totalLiveHours)} <span className="text-base font-medium text-slate-400">小時</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              平均每週 {avgHoursPerWeek} 小時
            </div>
          </div>
        </div>

        {/* B. 活躍天數 (3x2) */}
        <div className={`col-span-3 row-span-2 ${styles.glass} rounded-2xl p-4 flex flex-col justify-between group hover:bg-white/10 transition-colors`}>
          <div className="flex items-center gap-2 text-emerald-400 text-left">
            <Calendar size={18} />
            <span className="text-sm font-bold tracking-wide">活躍天數</span>
          </div>
          <div className="text-left">
            <div className="text-4xl font-bold tracking-tight">
              {stats.totalLiveDays} <span className="text-base font-medium text-slate-400">天</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              平均每週 {avgDaysPerWeek} 天
            </div>
          </div>
        </div>

        {/* C. 影片數量 (2x2) */}
        <div className={`col-span-2 row-span-2 ${styles.glass} rounded-2xl p-4 flex flex-col group hover:bg-white/10 transition-colors`}>
          <div className="flex items-center gap-2 text-blue-400 mb-2 text-left">
            <Video size={18} />
            <span className="text-sm font-bold tracking-wide">年度創作產出</span>
          </div>
          <div className="flex flex-col gap-1 justify-center flex-1 text-left">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
              <span>直播：<span className="font-bold text-white">{stats.videoCounts.live}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
              <span>影片：<span className="font-bold text-white">{stats.videoCounts.videos}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.8)]"></span>
              <span>Shorts：<span className="font-bold text-white">{stats.videoCounts.shorts}</span></span>
            </div>
          </div>
        </div>

        {/* D. 最長連續直播 (4x2) */}
        <div className={`col-span-4 row-span-2 ${styles.glass} rounded-2xl p-4 flex flex-row items-center justify-between group hover:bg-white/10 transition-colors`}>
          <div className="flex flex-col justify-center h-full gap-1 text-left">
            <div className="flex items-center gap-2 text-orange-400 mb-0.5">
              <Flame size={18} />
              <span className="text-sm font-bold tracking-wide">最長連續直播</span>
            </div>
            <div className="text-sm font-bold text-white tracking-wide bg-white/10 border border-white/5 px-2.5 py-1 rounded-md w-fit shadow-sm">
              {special.longestLiveStreak ? (
                formatDateRange(special.longestLiveStreak.startDate, special.longestLiveStreak.endDate)
              ) : 'N/A'}
            </div>
            {special.longestLiveStreak && (
              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                期間總時數：{formatDurationHM(special.longestLiveStreak.totalDuration)}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-orange-400 drop-shadow-sm">
              {special.longestLiveStreak?.days || 0} <span className="text-lg font-medium text-white">天</span>
            </div>
          </div>
        </div>

        {/* E. 遊戲排行 (3x4) */}
        {hasGames && (
          <div className={`col-span-3 row-span-4 ${styles.glass} rounded-2xl p-4 flex flex-col group hover:bg-white/10 transition-colors`}>
            <div className="flex items-center gap-2 text-pink-400 mb-4 text-left">
              <Gamepad2 size={18} />
              <span className="text-sm font-bold tracking-wide">最常玩遊戲</span>
            </div>
            <div className="flex-1 flex flex-col gap-2 overflow-hidden justify-start text-left">
              {special.topLiveGames?.slice(0, 5).map((g, i) => (
                <div key={g.game} className="flex justify-between items-baseline text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-mono text-slate-500">#{i + 1}</span>
                    <span className="truncate font-medium text-slate-200">{g.game}</span>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-1">
                    {formatDurationHM(g.totalDuration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* F. 年度之最 (年度最長直播) */}
        <div className={`${hasGames ? 'col-span-3' : 'col-span-6'} row-span-4 ${styles.glass} rounded-2xl p-5 flex flex-col group hover:bg-white/10 transition-colors relative overflow-hidden`}>
          {/* 背景裝飾 */}
          <Trophy size={80} className="absolute -right-4 -bottom-4 text-yellow-500/5 -rotate-12 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-2 text-yellow-500 mb-3 text-left">
            <Trophy size={18} />
            <span className="text-sm font-bold tracking-widest uppercase">年度最長直播紀錄</span>
          </div>

          {/* 🚀 關鍵修正：確保 i.longestLive 存在才渲染內容 */}
          {special.longestLive ? (
            <>
              {/* 紀錄方塊 (移動到判斷式內，避免 crash) */}
              <div className="mb-4 flex flex-col items-start">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-1.5 rounded-xl shadow-lg shadow-yellow-900/20">
                  <span className="text-2xl font-black text-slate-950 tracking-tighter">
                    {formatDurationHM(special.longestLive.duration)}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 ml-1">
                  紀錄時長
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between text-left">
                <p className={`text-base font-bold text-white leading-relaxed tracking-wide mb-4 ${hasGames ? 'line-clamp-3' : 'line-clamp-5'}`}>
                  {special.longestLive.title}
                </p>

                <div className="mt-auto space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    紀錄時刻
                  </div>
                  <div className="text-xs font-bold text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg w-fit">
                    {formatDateTimeGMT8(special.longestLive.publishDate)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* 🚀 當 i.longestLive 為空時顯示的 Fallback UI */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic text-sm text-center">
              今年度尚無直播紀錄
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer */}
      <footer className="relative z-10 mt-5 pt-3 border-t border-white/10 flex justify-between items-end">
        <div className="flex flex-col gap-1 text-left">
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Generated by</div>
          <div className="text-sm font-bold text-slate-300 tracking-wide">
            VTMap 頻道旅圖｜Vtuber TrailMap
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
          {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}
        </div>
      </footer>
    </div>
  );
}