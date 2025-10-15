import React from "react";
import { motion } from "framer-motion";

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

export default function SpecialHighlightsSection({ special }: SpecialHighlightsSectionProps) {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold tracking-tight">🌟 特殊項目統計</h2>

      {/* 最長直播 */}
      {special.longestLive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-muted-foreground text-sm">
            <strong>📺 最長直播：</strong>
            <br />
            <span>{special.longestLive.title}</span>
            <br />
            時長：{Math.round(special.longestLive.duration / 60)} 分鐘<br />
            發布日期：{special.longestLive.publishDate}
          </div>
        </motion.div>
      )}

      {/* 最短直播 */}
      {special.shortestLive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="text-muted-foreground text-sm">
            <strong>📺 最短直播（超過 5 分鐘）：</strong>
            <br />
            <span>{special.shortestLive.title}</span>
            <br />
            時長：{Math.round(special.shortestLive.duration / 60)} 分鐘<br />
            發布日期：{special.shortestLive.publishDate}
          </div>
        </motion.div>
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
            總時數：{Math.round(special.topGame.totalDuration / 3600)} 小時（約占 {special.topGame.percentage}%）
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
            總時數：{Math.round(special.secondTopGame.totalDuration / 3600)} 小時（約占 {special.secondTopGame.percentage}%）
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
