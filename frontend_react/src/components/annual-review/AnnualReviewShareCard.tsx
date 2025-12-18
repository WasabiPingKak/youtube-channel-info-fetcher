// src/components/annual-review/AnnualReviewShareCard.tsx

import React from "react";
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

  // 🧮 計算平均數據
  const avgHoursPerWeek = (stats.totalLiveHours / 52).toFixed(1);
  const avgDaysPerWeek = (stats.totalLiveDays / 52).toFixed(1);

  // 🎮 判斷是否有遊戲資料
  const hasGames = special.topLiveGames && special.topLiveGames.length > 0;

  return (
    // 📷 外框：維持 3:4 比例 (600px * 800px)
    <div
      id="share-card-node"
      className={`relative w-[600px] h-[800px] ${styles.cardBg} ${styles.textPrimary} p-8 flex flex-col justify-between overflow-hidden shadow-2xl`}
      style={{ fontFamily: '"Noto Sans TC", sans-serif' }}
    >
      {/* 裝飾背景光暈 */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* 1. Header (順序：年份 -> 頭像 -> 名稱，靠左對齊) */}
      <header className="relative z-10 flex items-center gap-4 mb-4">
        {/* 年份 */}
        <h1 className="shrink-0 text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 drop-shadow-sm">
          {year}
        </h1>

        {/* 垂直分隔線 (選擇性加入，或單純靠 gap) */}
        <div className="w-px h-10 bg-white/10 shrink-0" />

        {/* 頭像 */}
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

        {/* 頻道名稱 (使用 min-w-0 確保 line-clamp 正常運作) */}
        <div className="min-w-0 flex flex-col justify-center">
          <h2 className="font-bold text-lg leading-tight text-white line-clamp-2 text-left">
            {channelName}
          </h2>
          <p className={`text-sm ${styles.textSecondary} text-left`}>Year in Review</p>
        </div>
      </header>

      {/* 2. Core Stats Grid - Rows 8 */}
      <div className="relative z-10 grid grid-cols-6 grid-rows-[repeat(8,minmax(0,1fr))] gap-3 flex-1">

        {/* A. 總直播時數 (3x2) */}
        <div className={`col-span-3 row-span-2 ${styles.glass} rounded-2xl p-4 flex flex-col justify-between group hover:bg-white/10 transition-colors`}>
          <div className="flex items-center gap-2 text-indigo-400">
            <Clock size={18} />
            <span className="text-sm font-bold tracking-wide">總直播時數</span>
          </div>
          <div>
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
          <div className="flex items-center gap-2 text-emerald-400">
            <Calendar size={18} />
            <span className="text-sm font-bold tracking-wide">活躍天數</span>
          </div>
          <div>
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
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Video size={18} />
            <span className="text-sm font-bold tracking-wide">年度創作產出</span>
          </div>
          <div className="flex flex-col gap-1 justify-center flex-1">
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
          <div className="flex flex-col justify-center h-full gap-1">
            <div className="flex items-center gap-2 text-orange-400 mb-0.5">
              <Flame size={18} />
              <span className="text-sm font-bold tracking-wide">最長連續直播</span>
            </div>

            {/* ✨ 日期範圍：放大並強調 */}
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
            <div className="flex items-center gap-2 text-pink-400 mb-4">
              <Gamepad2 size={18} />
              <span className="text-sm font-bold tracking-wide">最常玩遊戲</span>
            </div>
            <div className="flex-1 flex flex-col gap-2 overflow-hidden justify-start">
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

        {/* F. 年度之最 (3x4 或 6x4) */}
        <div className={`${hasGames ? 'col-span-3' : 'col-span-6'} row-span-4 ${styles.glass} rounded-2xl p-4 flex flex-col group hover:bg-white/10 transition-colors`}>
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Trophy size={18} />
            <span className="text-sm font-bold tracking-wide">年度最長直播</span>
          </div>

          {special.longestLive ? (
            <div className="flex-1 flex flex-col">
              <p className={`text-sm font-medium text-slate-200 leading-relaxed tracking-wide mb-2 ${hasGames ? 'line-clamp-4' : 'line-clamp-6'}`}>
                {special.longestLive.title}
              </p>

              <div className="text-xs text-slate-500 mb-auto">
                {formatDateTimeGMT8(special.longestLive.publishDate)}
              </div>

              <div className="mt-4 text-right">
                <span className="text-xs text-slate-500 mr-2 uppercase tracking-wider">時長</span>
                <span className="text-xl font-bold text-yellow-400">
                  {formatDurationHM(special.longestLive.duration)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">無資料</div>
          )}
        </div>
      </div>

      {/* 3. Footer */}
      <footer className="relative z-10 mt-5 pt-3 border-t border-white/10 flex justify-between items-end">
        <div className="flex flex-col gap-1">
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