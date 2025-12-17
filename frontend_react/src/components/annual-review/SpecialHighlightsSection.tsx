import React from "react";
import type { SpecialStatsData } from "@/utils/statistics/types";
import { Video, CalendarDays, Gamepad2, Layers } from "lucide-react";
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
    <section className="space-y-8">
      <h2 className="text-2xl font-bold tracking-tight">🌟 特殊項目統計</h2>

      {/* 最長直播 */}
      {special.longestLive && (
        <StatCardWrapper delay={0}>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-3">
                <Video className="w-6 h-6 text-primary" />
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  最長單一直播
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {formatDurationHM(special.longestLive.duration)}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground leading-relaxed">
                {special.longestLive.title}
              </div>
              <div className="text-xs text-muted-foreground">
                發布時間：{formatDateTimeGMT8(special.longestLive.publishDate)}
              </div>
            </div>

            <div className="w-full md:w-1/2 overflow-hidden rounded-xl border bg-background">
              <div className="relative aspect-video w-full">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${special.longestLive.videoId}`}
                  title="YouTube video player"
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </StatCardWrapper>
      )}

      {/* 連續直播天數 */}
      {special.longestLiveStreak && (
        <StatCardWrapper delay={0.1}>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-3">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  最長連續直播天數
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {special.longestLiveStreak.days} 天
                </div>
              </div>
            </div>

            <div className="px-2">
              <StreakAxis
                startDate={special.longestLiveStreak.startDate}
                endDate={special.longestLiveStreak.endDate}
                days={special.longestLiveStreak.days}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                期間總直播時數：{formatDurationHM(special.longestLiveStreak.totalDuration)}
              </div>
            </div>

            <details className="rounded-xl border border-border bg-background/40">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-xl">
                查看詳細清單（共 {special.longestLiveStreak.items.length} 場）
              </summary>

              <div className="px-4 pb-4 pt-2">
                <ul className="space-y-2 text-sm">
                  {special.longestLiveStreak.items.map((it) => (
                    <li
                      key={it.videoId}
                      className="flex flex-col gap-1 border-b border-border pb-2 last:border-b-0"
                    >
                      <a
                        className="text-foreground hover:underline leading-relaxed"
                        href={`https://www.youtube.com/watch?v=${it.videoId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {it.title}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        時長：{formatDurationHM(it.duration)}　｜　發布時間：
                        {formatDateTimeGMT8(it.publishDate)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </StatCardWrapper>
      )}

      {/* 遊戲直播時數排行 + 玩過的不同遊戲數 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* 遊戲直播時數排行 */}
        {(special.topLiveGames?.length ?? 0) > 0 && (
          <div className="w-full">
            <StatCardWrapper delay={0.2}>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-muted p-3">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      遊戲直播時數排行（最多五筆）
                    </div>
                  </div>
                </div>

                <ol className="space-y-2 text-sm">
                  {special.topLiveGames.map((g, idx) => (
                    <li
                      key={g.game}
                      className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-b-0"
                    >
                      <div className="font-medium text-foreground">
                        {idx + 1}. {g.game}
                      </div>
                      <div className="text-muted-foreground">
                        {formatDurationHM(g.totalDuration)}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </StatCardWrapper>
          </div>
        )}

        {/* 玩過的不同遊戲數 */}
        {special.distinctGameCount > 0 && (
          <div className="w-full">
            <StatCardWrapper delay={0.25}>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-muted p-3">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      玩過的不同遊戲數
                    </div>
                    <div className="text-3xl font-bold tracking-tight">
                      {special.distinctGameCount} 種
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {special.distinctGameList.map((game) => (
                    <span
                      key={game}
                      className="px-3 py-1 rounded-full bg-muted text-sm text-foreground"
                    >
                      {game}
                    </span>
                  ))}
                </div>
              </div>
            </StatCardWrapper>
          </div>
        )}
      </div>
    </section>
  );
}