import React from "react";
import type { SpecialStatsData } from "@/utils/statistics/types";
import { Video, CalendarDays, Gamepad2, Layers, Trophy, Flame, PlayCircle, ChevronDown } from "lucide-react";
import StatCardWrapper from "./stat-cards/StatCardWrapper";
import StreakAxis from "./StreakAxis";
import { formatDurationHM, formatDateTimeGMT8 } from "./utils";

interface SpecialHighlightsSectionProps {
  special: SpecialStatsData;
}

export default function SpecialHighlightsSection({
  special,
}: SpecialHighlightsSectionProps) {
  return (
    <section className="space-y-12">
      {/* 🏆 成就 A: 最長直播 (YouTube 紅色調) */}
      {special.longestLive && (
        <StatCardWrapper delay={0}>
          <div className="relative overflow-hidden p-2">
            <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20 dark:ring-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <Video className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">
                      最長單一直播成就
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent leading-none">
                        {formatDurationHM(special.longestLive.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-snug">
                    {special.longestLive.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                    <PlayCircle size={14} className="text-red-500" />
                    發布於 {formatDateTimeGMT8(special.longestLive.publishDate)}
                  </div>
                </div>
              </div>

              {/* 影片預覽區 (劇院模式感) */}
              <div className="w-full lg:w-[400px] shrink-0">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-4 border-slate-100 dark:border-slate-800 shadow-2xl bg-slate-950">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${special.longestLive.videoId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </StatCardWrapper>
      )}

      {/* 🔥 成就 B: 連續直播天數 (橘色熱情調) */}
      {special.longestLiveStreak && (
        <StatCardWrapper delay={0.1}>
          <div className="space-y-8 p-2">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20 dark:ring-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                  <Flame className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">
                    最強連續直播毅力
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent leading-none">
                      {special.longestLiveStreak.days}
                    </span>
                    <span className="text-base font-bold text-slate-600 dark:text-slate-400">天</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
                <div className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-1">期間總投入時數</div>
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {formatDurationHM(special.longestLiveStreak.totalDuration)}
                </div>
              </div>
            </div>

            {/* 視覺化軸線區 */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-6 border border-slate-100 dark:border-slate-800">
              <StreakAxis
                startDate={special.longestLiveStreak.startDate}
                endDate={special.longestLiveStreak.endDate}
                days={special.longestLiveStreak.days}
              />
            </div>

            {/* 詳細清單 (優化過的展開效果) */}
            <details className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 transition-all overflow-hidden">
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors list-none">
                <span>查看詳細清單 (共 {special.longestLiveStreak.items.length} 場直播)</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
              </summary>

              <div className="px-6 pb-6 pt-2">
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {special.longestLiveStreak.items.map((it) => (
                    <li key={it.videoId} className="py-4 first:pt-0 last:pb-0">
                      <a
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-orange-500 transition-colors leading-relaxed block mb-1"
                        href={`https://youtube.com/watch?v=${it.videoId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {it.title}
                      </a>
                      <div className="flex gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-500">
                        <span>時長：{formatDurationHM(it.duration)}</span>
                        <span className="text-slate-300">|</span>
                        <span>發布於 {formatDateTimeGMT8(it.publishDate)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </StatCardWrapper>
      )}

      {/* 🕹️ 下方 1:1 佈局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

        {/* 遊戲排行 (靛色調) */}
        {(special.topLiveGames?.length ?? 0) > 0 && (
          <StatCardWrapper delay={0.2} className="h-full">
            <div className="space-y-6 p-2">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 dark:ring-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">
                    遊戲直播時數排行
                  </div>
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">這一年你最熱中的虛擬世界</div>
                </div>
              </div>

              <div className="space-y-5">
                {special.topLiveGames.map((g, idx) => {
                  const maxDuration = special.topLiveGames[0].totalDuration;
                  const percent = (g.totalDuration / maxDuration) * 100;
                  return (
                    <div key={g.game} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                          <span className="text-indigo-500 mr-2 opacity-50">#0{idx + 1}</span>
                          {g.game}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {formatDurationHM(g.totalDuration)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </StatCardWrapper>
        )}

        {/* 遊戲多樣性 (青色調) */}
        {special.distinctGameCount > 0 && (
          <StatCardWrapper delay={0.25} className="h-full">
            <div className="space-y-6 p-2">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20 dark:ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">
                    年度遊戲探索
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                      {special.distinctGameCount}
                    </span>
                    <span className="text-sm font-bold text-slate-500 uppercase">種不同的挑戰</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {special.distinctGameList.map((game) => (
                  <span
                    key={game}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:border-cyan-500/50 transition-colors"
                  >
                    {game}
                  </span>
                ))}
              </div>
            </div>
          </StatCardWrapper>
        )}
      </div>
    </section>
  );
}