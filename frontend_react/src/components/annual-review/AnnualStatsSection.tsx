import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Sparkles } from "lucide-react";
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
  遊戲: "#6366f1",
  雜談: "#10b981",
  節目: "#f59e0b",
  音樂: "#ef4444",
  未分類: "#64748b",
};

/**
 * 🛠️ 輔助工具：找出數據中的最高峰月份
 */
const findPeakMonth = (data: any[], keys: string[]) => {
  if (!data || data.length === 0) return null;
  return data.reduce((prev, current) => {
    const prevTotal = keys.reduce((sum, key) => sum + (prev[key] || 0), 0);
    const currTotal = keys.reduce((sum, key) => sum + (current[key] || 0), 0);
    return currTotal > prevTotal ? current : prev;
  });
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
  const videoTypeData = useMemo(() => parseVideoTypeMonthlyCounts(stats.monthlyVideoCounts), [stats.monthlyVideoCounts]);
  const categoryHourData = useMemo(() => parseCategoryMonthlyHours(stats.monthlyCategoryTime), [stats.monthlyCategoryTime]);

  // 計算巔峰月份
  const peakVideoMonth = useMemo(() => findPeakMonth(videoTypeData, ["live", "videos", "shorts"]), [videoTypeData]);
  const peakHourMonth = useMemo(() => findPeakMonth(categoryHourData, ["遊戲", "雜談", "節目", "音樂", "未分類"]), [categoryHourData]);

  return (
    <section className="space-y-12">
      {/* 1️⃣ 核心數據卡片區 (保持 1:2 結構) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <TotalLiveHoursCard hours={stats.totalLiveHours} />
          <TotalLiveDaysCard days={stats.totalLiveDays} />
          <VideoCountCard counts={stats.videoCounts} />
        </div>
        <div className="lg:col-span-2 min-h-[450px]">
          <CategoryRatioCard categoryTime={stats.categoryTime} />
        </div>
      </div>

      {/* 2️⃣ 趨勢圖表區 (視覺化舞台) */}
      <div className="grid grid-cols-1 gap-12">

        {/* 章節卡片 A: 創作律動 (原 Activity Trends) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/20 p-6 md:p-10 backdrop-blur-sm shadow-xl dark:shadow-2xl"
        >
          {/* 背景光暈裝飾 - 亮色模式減弱透明度 */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-80 w-80 bg-blue-500/[0.03] dark:bg-blue-500/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
                <TrendingUp size={14} />
                創作律動
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">每月創作活動趨勢</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium max-w-xl text-sm md:text-base">
                回顧這一年你在不同月份產出的內容比例。看看哪些時刻是你靈感爆發、最高產的時期。
              </p>
            </div>

            {/* 巔峰洞察標籤 (亮色模式適配) */}
            {peakVideoMonth && (
              <div className="shrink-0 flex items-center gap-4 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-2xl shadow-lg dark:shadow-xl">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">年度巔峰</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
                    {peakVideoMonth.month}月 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">產出最高</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 min-h-[350px]">
            <MonthlyBarChart
              chartTitle=""
              chartData={videoTypeData}
              dataKeys={["live", "videos", "shorts"]}
              colorMap={VIDEO_TYPE_COLORS}
              nameMap={VIDEO_TYPE_NAMES}
              xKey="month"
              stacked={true}
              yUnit="部"
            />
          </div>
        </motion.div>

        {/* 章節卡片 B: 內容板塊 (原 Content Distribution) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/20 p-6 md:p-10 backdrop-blur-sm shadow-xl dark:shadow-2xl"
        >
          {/* 背景光暈裝飾 */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-80 w-80 bg-emerald-500/[0.03] dark:bg-emerald-500/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <BarChart3 size={14} />
                內容板塊
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">每月直播內容分佈</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium max-w-xl text-sm md:text-base">
                分析你的直播題材如何隨季節演變。看看這一年中，你在不同主題上投入的時間軌跡。
              </p>
            </div>

            {/* 巔峰洞察標籤 (亮色模式適配) */}
            {peakHourMonth && (
              <div className="shrink-0 flex items-center gap-4 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-2xl shadow-lg dark:shadow-xl">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">年度巔峰</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
                    {peakHourMonth.month}月 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">時數最多</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 min-h-[350px]">
            <MonthlyBarChart
              chartTitle=""
              chartData={categoryHourData}
              dataKeys={["遊戲", "雜談", "節目", "音樂", "未分類"]}
              colorMap={BASE_COLORS}
              xKey="month"
              stacked={true}
              yUnit="小時"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}