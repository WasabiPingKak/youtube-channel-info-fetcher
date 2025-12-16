import type { SpecialStatsData } from "./types";
import type { ClassifiedVideoItem } from "@/hooks/useAnnualReviewData";
import { normalizeType } from "./computeAnnualReviewStats";

export function computeSpecialStats(allVideos: ClassifiedVideoItem[]): SpecialStatsData {
  const liveVideos = allVideos.filter(
    (v) => normalizeType(v.type) === "live"
  );
  if (liveVideos.length === 0) {
    return {
      longestLive: null,
      longestStreakDays: 0,
      mostActiveMonth: null,
      topGame: null,
      secondTopGame: null,
      distinctGameCount: 0,
      distinctGameList: [],
    };
  }

  // 1️⃣ 最長直播
  const longestLive = liveVideos.reduce((prev, curr) =>
    (curr.duration ?? 0) > (prev.duration ?? 0) ? curr : prev
  );

  // 3️⃣ 最長連續直播天數
  const dateStrings = Array.from(
    new Set(
      liveVideos.map((v) =>
        new Date(v.publishDate).toISOString().split("T")[0]
      )
    )
  ).sort();
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < dateStrings.length; i++) {
    const prev = new Date(dateStrings[i - 1]);
    const curr = new Date(dateStrings[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) currentStreak++;
    else currentStreak = 1;
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  // 4️⃣ 直播最多的月份
  const monthDurations = new Map<number, number>();
  for (const v of liveVideos) {
    const month = new Date(v.publishDate).getMonth() + 1;
    monthDurations.set(
      month,
      (monthDurations.get(month) ?? 0) + (v.duration ?? 0)
    );
  }
  const mostActiveMonthEntry = Array.from(monthDurations.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const mostActiveMonth = mostActiveMonthEntry
    ? { month: mostActiveMonthEntry[0], totalDuration: mostActiveMonthEntry[1] }
    : null;

  // 5️⃣ 時數最長的單一遊戲 + 第二長
  const gameDurationMap = new Map<string, number>();
  for (const v of liveVideos) {
    for (const cat of v.matchedCategories ?? []) {
      gameDurationMap.set(cat, (gameDurationMap.get(cat) ?? 0) + (v.duration ?? 0));
    }
  }
  const sortedGameDurations = Array.from(gameDurationMap.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const totalGameDuration = sortedGameDurations.reduce((sum, [, val]) => sum + val, 0);

  const topGame = sortedGameDurations[0]
    ? {
      category: sortedGameDurations[0][0],
      totalDuration: sortedGameDurations[0][1],
      percentage: totalGameDuration > 0
        ? Math.round((sortedGameDurations[0][1] / totalGameDuration) * 100)
        : 0,
    }
    : null;

  const secondTopGame = sortedGameDurations[1]
    ? {
      category: sortedGameDurations[1][0],
      totalDuration: sortedGameDurations[1][1],
      percentage: totalGameDuration > 0
        ? Math.round((sortedGameDurations[1][1] / totalGameDuration) * 100)
        : 0,
    }
    : null;

  // 6️⃣ 玩過的遊戲列表
  const distinctGameList = sortedGameDurations.map(([cat]) => cat);
  const distinctGameCount = distinctGameList.length;

  return {
    longestLive: longestLive
      ? {
        title: longestLive.title,
        duration: longestLive.duration,
        publishDate: longestLive.publishDate,
        videoId: longestLive.videoId,
      }
      : null,
    longestStreakDays: maxStreak,
    mostActiveMonth,
    topGame,
    secondTopGame,
    distinctGameCount,
    distinctGameList,
  };
}
