export type VideoItem = {
  videoId: string;
  [key: string]: any; // 允許其他動態欄位，如 publishDate, duration 等
};
