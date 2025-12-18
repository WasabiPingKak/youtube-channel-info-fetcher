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
    <section className="space-y-10">
      {/* 1️⃣ 統計摘要卡片區 (保持 1:2 結構) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：三張小卡堆疊 */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <TotalLiveHoursCard hours={stats.totalLiveHours} />
          <TotalLiveDaysCard days={stats.totalLiveDays} />
          <VideoCountCard counts={stats.videoCounts} />
        </div>

        {/* 右側：分類佔比大卡 */}
        <div className="lg:col-span-2 min-h-[400px]">
          <CategoryRatioCard categoryTime={stats.categoryTime} />
        </div>
      </div>

      {/* 2️⃣ 圖表區塊 - 增加間距與標題質感 */}
      <div className="grid grid-cols-1 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-slate-800 bg-slate-900/30 p-1"
        >
          <MonthlyBarChart
            chartTitle="每月創作活動趨勢"
            chartData={videoTypeData}
            dataKeys={["live", "videos", "shorts"]}
            colorMap={VIDEO_TYPE_COLORS}
            nameMap={VIDEO_TYPE_NAMES}
            xKey="month"
            stacked={true}
            yUnit="部"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl border border-slate-800 bg-slate-900/30 p-1"
        >
          <MonthlyBarChart
            chartTitle="每月直播內容分佈"
            chartData={categoryHourData}
            dataKeys={["遊戲", "雜談", "節目", "音樂", "未分類"]}
            colorMap={BASE_COLORS}
            xKey="month"
            stacked={true}
            yUnit="小時"
          />
        </motion.div>
      </div>
    </section>
  );
}