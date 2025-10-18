import React from "react";
import { motion } from "framer-motion";
import TotalLiveHoursCard from "./stat-cards/TotalLiveHoursCard";
import VideoCountCard from "./stat-cards/VideoCountCard";
import CategoryRatioCard from "./stat-cards/CategoryRatioCard";

export interface AnnualStatsSectionProps {
  stats: {
    videoCounts: {
      shorts: number;
      videos: number;
      live: number;
    };
    totalLiveHours: number;
    monthlyVideoCounts: {
      month: number;
      shorts: number;
      videos: number;
      live: number;
    }[];
    categoryTime: {
      category: string;
      seconds: number;
    }[];
    monthlyCategoryTime: {
      month: number;
      categoryTimes: {
        category: string;
        seconds: number;
      }[];
    }[];
  };
}

export default function AnnualStatsSection({ stats }: AnnualStatsSectionProps) {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold tracking-tight">📊 一般統計</h2>

      {/* 1️⃣ 統計摘要卡片區：左右分欄排版 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* 左側：上下兩張卡片（1 單位寬） */}
        <div className="flex flex-col gap-4 md:col-span-1">
          <TotalLiveHoursCard hours={stats.totalLiveHours} />
          <VideoCountCard counts={stats.videoCounts} />
        </div>

        {/* 右側：甜甜圈圖（2 單位寬） */}
        <div className="md:col-span-2">
          <CategoryRatioCard categoryTime={stats.categoryTime} />
        </div>
      </motion.div>

      {/* 2️⃣ 每月影片種類堆疊圖（之後會改為圖表元件） */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="text-muted-foreground text-sm">
          <strong>✅ 每月影片數：</strong>
          <ul className="list-disc list-inside ml-4">
            {stats.monthlyVideoCounts.map((m) => (
              <li key={m.month}>
                {m.month} 月 - Shorts: {m.shorts}, Videos: {m.videos}, Live: {m.live}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* 3️⃣ 直播分類總時長（之後會被 donut 圖取代） */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="text-muted-foreground text-sm">
          <strong>✅ 直播分類總時長（以秒為單位）：</strong>
          <ul className="list-disc list-inside ml-4">
            {stats.categoryTime.map((c) => (
              <li key={c.category}>
                {c.category}：{c.seconds} 秒（約 {(c.seconds / 3600).toFixed(1)} 小時）
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* 4️⃣ 每月分類直播時長（之後會被堆疊圖取代） */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="text-muted-foreground text-sm">
          <strong>✅ 每月分類直播時長：</strong>
          <ul className="list-disc list-inside ml-4 space-y-1">
            {stats.monthlyCategoryTime.map((m) => (
              <li key={m.month}>
                <span>{m.month} 月：</span>
                <ul className="ml-4 list-disc list-inside">
                  {m.categoryTimes.map((ct) => (
                    <li key={ct.category}>
                      {ct.category}：{ct.seconds} 秒（約 {(ct.seconds / 3600).toFixed(1)} 小時）
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
