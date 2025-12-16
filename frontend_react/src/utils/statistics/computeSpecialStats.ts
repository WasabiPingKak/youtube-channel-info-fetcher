import type { SpecialStatsData } from "./types";
import type { ClassifiedVideoItem } from "@/hooks/useAnnualReviewData";
import { normalizeType } from "./computeAnnualReviewStats";

/** 把任意 publishDate 轉成 GMT+8 的日鍵：YYYY-MM-DD */
function toGmt8DateKey(publishDate: string): string {
  const d = new Date(publishDate);
  if (Number.isNaN(d.getTime())) return "Invalid-Date";

  // UTC ms + 8 hours, then use UTC getters to avoid local timezone interference
  const gmt8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);

  const yyyy = gmt8.getUTCFullYear();
  const mm = String(gmt8.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(gmt8.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function computeSpecialStats(
  allVideos: ClassifiedVideoItem[]
): SpecialStatsData {
  const liveVideos = allVideos.filter((v) => normalizeType(v.type) === "live");

  if (liveVideos.length === 0) {
    return {
      longestLive: null,
      longestLiveStreak: null,
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

  // 2️⃣ 最長連續直播（GMT+8 切日；平手：總時數優先，再選較晚 endDate）
  const byDay = new Map<string, ClassifiedVideoItem[]>();
  for (const v of liveVideos) {
    const dayKey = toGmt8DateKey(v.publishDate);
    if (dayKey === "Invalid-Date") continue;

    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey)!.push(v);
  }

  const dayKeys = Array.from(byDay.keys()).sort(); // YYYY-MM-DD lexicographical works

  let best: {
    days: number;
    startDate: string;
    endDate: string;
    totalDuration: number;
    items: ClassifiedVideoItem[];
  } | null = null;

  let curDays = 0;
  let curStart = "";
  let curEnd = "";
  let curTotal = 0;
  let curItems: ClassifiedVideoItem[] = [];

  function commitIfBetter() {
    if (curDays <= 0) return;
    const candidate = {
      days: curDays,
      startDate: curStart,
      endDate: curEnd,
      totalDuration: curTotal,
      items: curItems,
    };

    if (!best) {
      best = candidate;
      return;
    }

    // ① 天數多者勝
    if (candidate.days > best.days) {
      best = candidate;
      return;
    }
    if (candidate.days < best.days) return;

    // ② 天數相同：總時數多者勝
    if (candidate.totalDuration > best.totalDuration) {
      best = candidate;
      return;
    }
    if (candidate.totalDuration < best.totalDuration) return;

    // ③ 再相同：endDate 較晚者勝（YYYY-MM-DD 可直接比字串）
    if (candidate.endDate > best.endDate) {
      best = candidate;
    }
  }

  for (let i = 0; i < dayKeys.length; i++) {
    const key = dayKeys[i];
    const itemsToday = byDay.get(key) ?? [];
    const durationToday = itemsToday.reduce((sum, v) => sum + (v.duration ?? 0), 0);

    if (curDays === 0) {
      // start new streak
      curDays = 1;
      curStart = key;
      curEnd = key;
      curTotal = durationToday;
      curItems = [...itemsToday];
      continue;
    }

    const prevKey = dayKeys[i - 1];
    const prevDate = new Date(`${prevKey}T00:00:00Z`);
    const currDate = new Date(`${key}T00:00:00Z`);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      // extend streak
      curDays += 1;
      curEnd = key;
      curTotal += durationToday;
      curItems.push(...itemsToday);
    } else {
      // end current streak, commit
      commitIfBetter();

      // start new streak
      curDays = 1;
      curStart = key;
      curEnd = key;
      curTotal = durationToday;
      curItems = [...itemsToday];
    }
  }
  // commit last streak
  commitIfBetter();

  // 排序 items：先依 GMT+8 日，再依 publishDate（時間）早到晚
  const longestLiveStreak =
    best && best.days > 0
      ? {
        days: best.days,
        startDate: best.startDate,
        endDate: best.endDate,
        totalDuration: best.totalDuration,
        items: best.items
          .slice()
          .sort((a, b) => {
            const ad = toGmt8DateKey(a.publishDate);
            const bd = toGmt8DateKey(b.publishDate);
            if (ad !== bd) return ad < bd ? -1 : 1;
            const at = new Date(a.publishDate).getTime();
            const bt = new Date(b.publishDate).getTime();
            return at - bt;
          })
          .map((v) => ({
            videoId: v.videoId,
            title: v.title,
            duration: v.duration ?? 0,
            publishDate: v.publishDate,
          })),
      }
      : null;

  // 3️⃣ 直播最多的月份（以直播總秒數）
  const monthDurations = new Map<number, number>();
  for (const v of liveVideos) {
    const month = new Date(v.publishDate).getMonth() + 1;
    monthDurations.set(month, (monthDurations.get(month) ?? 0) + (v.duration ?? 0));
  }
  const mostActiveMonthEntry = Array.from(monthDurations.entries()).sort((a, b) => b[1] - a[1])[0];
  const mostActiveMonth = mostActiveMonthEntry
    ? { month: mostActiveMonthEntry[0], totalDuration: mostActiveMonthEntry[1] }
    : null;

  // 4️⃣ 時數最長的單一遊戲 + 第二長（沿用你原本的累加方式）
  const gameDurationMap = new Map<string, number>();
  for (const v of liveVideos) {
    for (const cat of v.matchedCategories ?? []) {
      gameDurationMap.set(cat, (gameDurationMap.get(cat) ?? 0) + (v.duration ?? 0));
    }
  }
  const sortedGameDurations = Array.from(gameDurationMap.entries()).sort((a, b) => b[1] - a[1]);
  const totalGameDuration = sortedGameDurations.reduce((sum, [, val]) => sum + val, 0);

  const topGame = sortedGameDurations[0]
    ? {
      category: sortedGameDurations[0][0],
      totalDuration: sortedGameDurations[0][1],
      percentage: totalGameDuration > 0 ? Math.round((sortedGameDurations[0][1] / totalGameDuration) * 100) : 0,
    }
    : null;

  const secondTopGame = sortedGameDurations[1]
    ? {
      category: sortedGameDurations[1][0],
      totalDuration: sortedGameDurations[1][1],
      percentage: totalGameDuration > 0 ? Math.round((sortedGameDurations[1][1] / totalGameDuration) * 100) : 0,
    }
    : null;

  // 5️⃣ 玩過的遊戲列表
  const distinctGameList = sortedGameDurations.map(([cat]) => cat);
  const distinctGameCount = distinctGameList.length;

  return {
    longestLive: longestLive
      ? {
        title: longestLive.title,
        duration: longestLive.duration ?? 0,
        publishDate: longestLive.publishDate,
        videoId: longestLive.videoId,
      }
      : null,
    longestLiveStreak,
    mostActiveMonth,
    topGame,
    secondTopGame,
    distinctGameCount,
    distinctGameList,
  };
}
