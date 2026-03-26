// src/utils/badgeUtils.ts
import type { Badge } from "@/types/video";
import type { ClassifiedVideoItem } from "@/types/category";
import type { LiveChannelData } from "@/types/live";

interface MatchedPair {
  main: string;
  keyword: string;
  hitKeywords?: string[];
}

/**
 * 用於已分類影片資料（例如影片清單）
 */
export function getBadgesFromClassifiedVideo(video: ClassifiedVideoItem): Badge[] {
  const matchedPairs: MatchedPair[] = video?.matchedPairs ?? [];
  const matchedKeywords: string[] = video?.matchedKeywords ?? [];

  if (matchedPairs.length > 0) {
    return matchedPairs.map((pair) => ({
      main: pair.main as Badge["main"],
      keyword: pair.keyword,
      tooltip: pair.main === "遊戲" ? matchedKeywords.join(", ") : undefined,
    }));
  }

  return [{ main: "未分類" }];
}

/**
 * 用於直播頻道資料（LiveRedirectPage 使用）
 */
export function getBadgesFromLiveChannel(channel: LiveChannelData): Badge[] {
  const category = (channel?.live as Record<string, unknown>)?.category as { matchedPairs?: MatchedPair[] } | undefined;
  const matchedPairs: MatchedPair[] = category?.matchedPairs ?? [];
  const matchedKeywords = matchedPairs
    .flatMap((pair) => pair.hitKeywords ?? [])
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i); // 去重複

  if (matchedPairs.length > 0) {
    return matchedPairs.map((pair) => ({
      main: pair.main as Badge["main"],
      keyword: pair.keyword,
      tooltip: pair.main === "遊戲" ? matchedKeywords.join(", ") : undefined,
    }));
  }

  return [{ main: "未分類" }];
}
