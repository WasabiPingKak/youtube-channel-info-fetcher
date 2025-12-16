import React from "react";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import StatCardWrapper from "./stat-cards/StatCardWrapper";

export interface SpecialStatsData {
  longestLive: {
    title: string;
    duration: number;
    publishDate: string;
    videoId: string;
  } | null;
  shortestLive: {
    title: string;
    duration: number;
    publishDate: string;
    videoId: string;
  } | null;
  longestStreakDays: number;
  mostActiveMonth: {
    month: number;
    totalDuration: number;
  } | null;
  topGame: {
    category: string;
    totalDuration: number;
    percentage: number;
  } | null;
  secondTopGame: {
    category: string;
    totalDuration: number;
    percentage: number;
  } | null;
  distinctGameCount: number;
  distinctGameList: string[];
}

interface SpecialHighlightsSectionProps {
  special: SpecialStatsData;
}

/** 秒 -> X小時Y分鐘（<1小時不顯示小時；分鐘向下取整） */
function formatDurationHM(totalSeconds?: number | null): string {
  const s = typeof totalSeconds === "number" ? totalSeconds : 0;
  if (s <= 0) return "未知";

  const totalMinutes = Math.floor(s / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}分鐘`;
  return `${hours}小時${minutes}分鐘`;
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
                  最長直播
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="text-muted-foreground text-sm">
          <strong>📅 最長連續直播天數：</strong> {special.longestStreakDays} 天
        </div>
      </motion.div>

      {/* 直播最活躍月份 */}
      {special.mostActiveMonth && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="text-muted-foreground text-sm">
            <strong>📆 直播最活躍月份：</strong> {special.mostActiveMonth.month} 月
            <br />
            總時數：{Math.round(special.mostActiveMonth.totalDuration / 3600)} 小時
          </div>
        </motion.div>
      )}

      {/* 單一遊戲最長時數 */}
      {special.topGame && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="text-muted-foreground text-sm">
            <strong>🎮 時數最長的遊戲：</strong> {special.topGame.category}
            <br />
            總時數：{Math.round(special.topGame.totalDuration / 3600)} 小時（約占{" "}
            {special.topGame.percentage}%）
          </div>
        </motion.div>
      )}

      {/* 第二長時數遊戲 */}
      {special.secondTopGame && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <div className="text-muted-foreground text-sm">
            <strong>🥈 時數第二長的遊戲：</strong> {special.secondTopGame.category}
            <br />
            總時數：{Math.round(special.secondTopGame.totalDuration / 3600)} 小時（約占{" "}
            {special.secondTopGame.percentage}%）
          </div>
        </motion.div>
      )}

      {/* 總遊戲數 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="text-muted-foreground text-sm">
          <strong>🗂️ 玩過的不同遊戲數：</strong> {special.distinctGameCount} 種
          <br />
          <span className="text-xs">({special.distinctGameList.join(", ")})</span>
        </div>
      </motion.div>
    </section>
  );
}
