// src/utils/badgeUtils.ts
import type { Badge } from "@/types/video";

/**
 * 用於已分類影片資料（例如影片清單）
 */
export function getBadgesFromClassifiedVideo(video: any): Badge[] {
  const matchedPairs = video?.matchedPairs ?? [];
  const matchedKeywords = video?.matchedKeywords ?? [];

  if (matchedPairs.length > 0) {
    return matchedPairs.map((pair: any) => ({
      main: pair.main,
      keyword: pair.keyword,
      tooltip: pair.main === "遊戲" ? matchedKeywords.join(", ") : undefined,
    }));
  }

  return [{ main: "未分類" }];
}

/**
 * 用於直播頻道資料（LiveRedirectPage 使用）
 */
export function getBadgesFromLiveChannel(channel: any): Badge[] {
  const category = channel?.live?.category ?? {};
  const matchedPairs = category.matchedPairs ?? [];
  const matchedKeywords = matchedPairs
    .flatMap((pair: any) => pair.hitKeywords ?? [])
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i); // 去重複

  if (matchedPairs.length > 0) {
    return matchedPairs.map((pair: any) => ({
      main: pair.main,
      keyword: pair.keyword,
      tooltip: pair.main === "遊戲" ? matchedKeywords.join(", ") : undefined,
    }));
  }

  return [{ main: "未分類" }];
}
