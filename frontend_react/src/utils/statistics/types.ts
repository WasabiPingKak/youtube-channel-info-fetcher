import type { ClassifiedVideoItem } from "@/hooks/useAnnualReviewData";

/** 📊 年度統計數據（一般統計） */
export interface AnnualStatsData {
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
}

/** 🌟 特殊統計數據（進階分析） */
export interface SpecialStatsData {
  longestLive: {
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
