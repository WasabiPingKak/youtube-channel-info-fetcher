import type { SpecialStatsData } from "./types";
import type { ClassifiedVideoItem } from "@/hooks/useAnnualReviewData";
import { normalizeType } from "./computeAnnualReviewStats";

/** 把任意 publishDate 轉成 GMT+8 的日鍵：YYYY-MM-DD */
function toGmt8DateKey(publishDate: string): string {
  const d = new Date(publishDate);
  if (Number.isNaN(d.getTime())) return "Invalid-Date";

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
      topLiveGames: [],
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

    if (candidate.days > best.days) {
      best = candidate;
      return;
    }
    if (candidate.days < best.days) return;

    if (candidate.totalDuration > best.totalDuration) {
      best = candidate;
      return;
    }
    if (candidate.totalDuration < best.totalDuration) return;

    if (candidate.endDate > best.endDate) {
      best = candidate;
    }
  }

  for (let i = 0; i < dayKeys.length; i++) {
    const key = dayKeys[i];
    const itemsToday = byDay.get(key) ?? [];
    const durationToday = itemsToday.reduce((sum, v) => sum + (v.duration ?? 0), 0);

    if (curDays === 0) {
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
    const diffDays =
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      curDays += 1;
      curEnd = key;
      curTotal += durationToday;
      curItems.push(...itemsToday);
    } else {
      commitIfBetter();
      curDays = 1;
      curStart = key;
      curEnd = key;
      curTotal = durationToday;
      curItems = [...itemsToday];
    }
  }
  commitIfBetter();

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

  // 3️⃣ 直播(live)累計時數前三名的「遊戲」：以 game 欄位為準；沒 game(空/null/缺) 就排除
  const gameDurationMap = new Map<string, number>();
  for (const v of liveVideos) {
    const rawGame = v.game;
    const game = typeof rawGame === "string" ? rawGame.trim() : "";
    if (!game) continue; // 沒 game -> 視為不是遊戲，排除

    const duration = v.duration ?? 0;
    gameDurationMap.set(game, (gameDurationMap.get(game) ?? 0) + duration);
  }

  const topLiveGames = Array.from(gameDurationMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([game, totalDuration]) => ({ game, totalDuration }));

  // 4️⃣ 玩過的遊戲列表（同樣以 game 欄位為準；沒 game 排除）
  const distinctGameList = Array.from(gameDurationMap.keys()).sort((a, b) =>
    a.localeCompare(b, "en")
  );
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
    topLiveGames,
    distinctGameCount,
    distinctGameList,
  };
}
