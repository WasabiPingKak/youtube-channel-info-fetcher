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

  /** 最長連續直播資訊（以 GMT+8 切日） */
  longestLiveStreak: {
    days: number;
    startDate: string; // "YYYY-MM-DD" (GMT+8)
    endDate: string;   // "YYYY-MM-DD" (GMT+8)
    totalDuration: number; // seconds
    items: {
      videoId: string;
      title: string;
      duration: number; // seconds
      publishDate: string; // 原始 publishDate（顯示時再轉 GMT+8）
    }[];
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
