export type VideoItem = {
  videoId: string;
  [key: string]: any; // 允許其他動態欄位，如 publishDate, duration 等
};

export interface Badge {
  main: "雜談" | "節目" | "音樂" | "遊戲" | "其他" | "未分類";
  keyword?: string;
  tooltip?: string;
}