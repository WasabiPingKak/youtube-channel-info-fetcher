import React from "react";
import type { SpecialStatsData } from "@/utils/statistics/types";
import { Video, CalendarDays, Gamepad2, Layers } from "lucide-react";
import StatCardWrapper from "./stat-cards/StatCardWrapper";

interface SpecialHighlightsSectionProps {
  special: SpecialStatsData;
}

// --- Helper Functions ---

function formatDurationHM(totalSeconds?: number | null): string {
  const s = typeof totalSeconds === "number" ? totalSeconds : 0;
  if (s <= 0) return "未知";

  const totalMinutes = Math.floor(s / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}分鐘`;
  const mm = String(minutes).padStart(2, "0");
  return `${hours}小時${mm}分鐘`;
}

function formatDateTimeGMT8(isoString?: string | null): string {
  if (!isoString) return "未知";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "未知";

  const gmt8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const yyyy = gmt8.getUTCFullYear();
  const mm = String(gmt8.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(gmt8.getUTCDate()).padStart(2, "0");
  const hh = String(gmt8.getUTCHours()).padStart(2, "0");
  const min = String(gmt8.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min} (GMT+8)`;
}

function parseYMDToUtc(ymd?: string | null): Date | null {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function calcInclusiveDays(startYmd?: string | null, endYmd?: string | null): number | null {
  const s = parseYMDToUtc(startYmd);
  const e = parseYMDToUtc(endYmd);
  if (!s || !e) return null;
  const diff = e.getTime() - s.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

function clampInt(n: unknown, min: number, max: number): number {
  const x = typeof n === "number" ? Math.floor(n) : NaN;
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function formatDateWithWeekday(dateStr?: string | null): string {
  if (!dateStr) return "未知日期";
  const date = parseYMDToUtc(dateStr);
  if (!date) return dateStr;

  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const w = weekdays[date.getUTCDay()];

  return `${month}月${day}日 ${w}`;
}

// --- Components ---

/**
 * 簡約版連續天數數軸
 * 風格：無背景，主色調線條
 */
function StreakAxis({
  startDate,
  endDate,
  days,
}: {
  startDate?: string | null;
  endDate?: string | null;
  days?: number | null;
}) {
  const derived = calcInclusiveDays(startDate, endDate);
  const n = derived ?? (typeof days === "number" ? Math.floor(days) : 0);
  const safeN = clampInt(n, 1, 3650);

  // 天數 > 60 時隱藏中間刻度，避免擁擠
  const showIntermediateTicks = safeN <= 60;

  const startText = formatDateWithWeekday(startDate);
  const endText = formatDateWithWeekday(endDate);

  if (safeN <= 0) return null;

  return (
    <div className="mt-2 w-full px-2 py-4">
      {/* 數軸主體區域 */}
      <div className="relative h-10 w-full">
        {/* 1. 主橫線 (基底，淡色) */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-border rounded-full" />

        {/* 2. 左端點刻度 (主色，強調) */}
        <div className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary rounded-full" />

        {/* 3. 右端點刻度 (主色，強調) */}
        <div className="absolute right-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary rounded-full" />

        {/* 4. 中間刻度 (半透明主色) */}
        {showIntermediateTicks && safeN > 1 && (
          <div className="absolute inset-0 mx-[1px]">
            {Array.from({ length: safeN - 2 }).map((_, i) => {
              const pct = ((i + 1) / (safeN - 1)) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 h-2 w-[1px] -translate-y-1/2 bg-primary/40"
                  style={{ left: `${pct}%` }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 底部日期文字：左右對齊 */}
      <div className="flex justify-between text-xs font-medium text-muted-foreground">
        <span className="-translate-x-1">{startText}</span>
        <span className="translate-x-1">{endText}</span>
      </div>
    </div>
  );
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

            <div className="rounded-xl px-4 pb-2 pt-0">
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