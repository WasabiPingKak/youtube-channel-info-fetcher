/** 📊 年度統計數據��一般統計） */
export interface AnnualStatsData {
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
}

/** 🌟 特殊統計數據（進階分析） */
export interface SpecialStatsData {
  longestLive: {
    title: string;
    duration: number;
    publishDate: string;
    videoId: string;
  } | null;

  longestLiveStreak: {
    days: number;
    startDate: string; // "YYYY-MM-DD" (GMT+8)
    endDate: string; // "YYYY-MM-DD" (GMT+8)
    totalDuration: number; // seconds
    items: {
      videoId: string;
      title: string;
      duration: number; // seconds
      publishDate: string; // 原始 publishDate
    }[];
  } | null;

  /** 直播(live)累計時數前三名的「遊戲」(以 game 欄位為準；沒 game 則排除) */
  topLiveGames: {
    game: string;
    totalDuration: number; // seconds
  }[];

  distinctGameCount: number;
  distinctGameList: string[];
}
