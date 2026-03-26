export type VideoItem = {
  videoId: string;
  title?: string;
  publishDate?: string;
  duration?: number;
  type?: string;
  matchedCategories?: string[];
  matchedKeywords?: string[];
  matchedPairs?: { main: string; keyword: string; hitKeywords?: string[] }[];
  game?: string | null;
};

export interface Badge {
  main: "雜談" | "節目" | "音樂" | "遊戲" | "其他" | "未分類";
  keyword?: string;
  tooltip?: string;
}