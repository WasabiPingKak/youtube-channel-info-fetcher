import React from "react";
import { motion } from "framer-motion";
import TotalLiveHoursCard from "./stat-cards/TotalLiveHoursCard";
import TotalLiveDaysCard from "./stat-cards/TotalLiveDaysCard";
import VideoCountCard from "./stat-cards/VideoCountCard";
import CategoryRatioCard from "./stat-cards/CategoryRatioCard";
import MonthlyBarChart from "./MonthlyBarChart";
import {
  parseVideoTypeMonthlyCounts,
  parseCategoryMonthlyHours,
} from "@/utils/parseMonthlyStats";

const VIDEO_TYPE_COLORS = {
  shorts: "#f472b6",
  videos: "#60a5fa",
  live: "#ef4444",
};

const VIDEO_TYPE_NAMES = {
  live: "直播",
  videos: "影片",
  shorts: "Shorts",
};

const BASE_COLORS = {
  遊戲: "#504ac6",
  雜談: "#4cb373",
  節目: "#ffac0c",
  音樂: "#ff7f50",
  未分類: "#9ca3af",
};

export interface AnnualStatsSectionProps {
  // ... (Props 定義不變)
  stats: {
    videoCounts: {
      shorts: number;
      videos: number;
      live: number;
    };
    totalLiveHours: number;
    totalLiveDays: number;
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
  const videoTypeData = parseVideoTypeMonthlyCounts(stats.monthlyVideoCounts);
  const categoryHourData = parseCategoryMonthlyHours(stats.monthlyCategoryTime);

  return (
    <section className="space-y-8">
      {/* 1️⃣ 統計摘要卡片區 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-stretch"
      >
        <div className="flex flex-col gap-4 md:col-span-1 md:h-full">
          <TotalLiveHoursCard hours={stats.totalLiveHours} />
          <TotalLiveDaysCard days={stats.totalLiveDays} />
          <VideoCountCard counts={stats.videoCounts} />
        </div>

        <div className="md:col-span-2 md:h-full">
          <CategoryRatioCard categoryTime={stats.categoryTime} />
        </div>
      </motion.div>

      {/* 2️⃣ 每月影片種類圖表 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <MonthlyBarChart
          chartTitle="每月影片數"
          chartData={videoTypeData}
          dataKeys={["live", "videos", "shorts"]}
          colorMap={VIDEO_TYPE_COLORS}
          nameMap={VIDEO_TYPE_NAMES}
          xKey="month"
          stacked={true}
          yUnit="部"
        />
      </motion.div>

      {/* 3️⃣ 每月分類直播時長圖表 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <MonthlyBarChart
          chartTitle="每月分類直播時長"
          chartData={categoryHourData}
          dataKeys={["遊戲", "雜談", "節目", "音樂", "未分類"]}
          colorMap={BASE_COLORS}
          xKey="month"
          stacked={true}
          yUnit="小時"
        />
      </motion.div>
    </section>
  );
}