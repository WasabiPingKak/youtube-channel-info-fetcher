export interface MonthlyVideoCountsRaw {
  month: number; // 1 ~ 12
  shorts: number;
  videos: number;
  live: number;
}

export interface MonthlyCategoryTimeRaw {
  month: number;
  categoryTimes: {
    category: string;
    seconds: number;
  }[];
}

export interface ParsedMonthlyData {
  month: string;
  [key: string]: string | number;
}

/**
 * 將影片數統計資料轉換為圖表使用格式（加上補0的月份字串）
 */
export function parseVideoTypeMonthlyCounts(
  data: MonthlyVideoCountsRaw[]
): ParsedMonthlyData[] {
  return data.map(({ month, ...rest }) => ({
    month: String(month).padStart(2, "0"),
    ...rest,
  }));
}

/**
 * 將分類直播時長（秒）轉換為以小時計、展平成分類欄位的圖表資料
 */
export function parseCategoryMonthlyHours(
  data: MonthlyCategoryTimeRaw[],
  expectedCategories: string[] = ["遊戲", "雜談", "節目", "音樂", "未分類"]
): ParsedMonthlyData[] {
  return data.map(({ month, categoryTimes }) => {
    const row: ParsedMonthlyData = {
      month: String(month).padStart(2, "0"),
    };

    // 先預設全部分類為 0
    expectedCategories.forEach((cat) => {
      row[cat] = 0;
    });

    // 填入實際分類秒數轉小時
    categoryTimes.forEach(({ category, seconds }) => {
      row[category] = +(seconds / 3600).toFixed(1); // 保留1位小數
    });

    return row;
  });
}
