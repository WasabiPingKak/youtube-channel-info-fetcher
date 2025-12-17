import React from "react";
import type { SpecialStatsData } from "@/utils/statistics/types";
import { motion } from "framer-motion";
import { Video, CalendarDays, Gamepad2, Layers } from "lucide-react";
import StatCardWrapper from "./stat-cards/StatCardWrapper";

interface SpecialHighlightsSectionProps {
  special: SpecialStatsData;
}

/** 秒 -> X小時MM分鐘（<1小時不顯示小時；有小時時分鐘補零） */
function formatDurationHM(totalSeconds?: number | null): string {
  const s = typeof totalSeconds === "number" ? totalSeconds : 0;
  if (s <= 0) return "未知";

  const totalMinutes = Math.floor(s / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    // 沒有小時，不補零
    return `${minutes}分鐘`;
  }

  // 有小時，分鐘補兩位數
  const mm = String(minutes).padStart(2, "0");
  return `${hours}小時${mm}分鐘`;
}


/** ISO(UTC) -> YYYY-MM-DD HH:MM (GMT+8) */
function formatDateTimeGMT8(isoString?: string | null): string {
  if (!isoString) return "未知";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "未知";

  // UTC ms + 8 hours
  const gmt8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);

  const yyyy = gmt8.getUTCFullYear();
  const mm = String(gmt8.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(gmt8.getUTCDate()).padStart(2, "0");
  const hh = String(gmt8.getUTCHours()).padStart(2, "0");
  const min = String(gmt8.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min} (GMT+8)`;
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
            {/* Header + 主數字（對齊總直播時數風格） */}
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-3">
                <Video className="w-6 h-6 text-primary" />
              </div>

              <div>
                {/* 小標題 */}
                <div className="text-sm text-muted-foreground mb-1">
                  最長單一直播
                </div>

                {/* 主數字 */}
                <div className="text-3xl font-bold tracking-tight">
                  {formatDurationHM(special.longestLive.duration)}
                </div>
              </div>
            </div>

            {/* 輔助資訊 */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground leading-relaxed">
                {special.longestLive.title}
              </div>

              <div className="text-xs text-muted-foreground">
                發布時間：{formatDateTimeGMT8(special.longestLive.publishDate)}
              </div>
            </div>

            {/* YouTube Embed */}
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
            {/* Header + 主數字（對齊總直播時數風格） */}
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

                <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {special.longestLiveStreak.startDate} ～ {special.longestLiveStreak.endDate}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    （GMT+8）
                  </span>
                </div>
              </div>
            </div>

            {/* 期間 + 總時數 */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                總時數：{formatDurationHM(special.longestLiveStreak.totalDuration)}
              </div>
            </div>

            {/* 清單（連結即可，不 embed） */}
            <details className="rounded-xl border border-border bg-background/40">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-xl">
                這段期間的直播清單（共 {special.longestLiveStreak.items.length} 場）
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

        {/* 玩過的不同遊戲數（Badges） */}
        {special.distinctGameCount > 0 && (
          <div className="w-full">
            <StatCardWrapper delay={0.25}>
              <div className="space-y-4">
                {/* Header + 主數字 */}
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

                {/* Badges */}
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
