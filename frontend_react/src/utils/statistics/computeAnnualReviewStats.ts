import type { ClassifiedVideoItem } from "@/hooks/useAnnualReviewData";
import { computeSpecialStats } from "./computeSpecialStats";
import type { AnnualStatsData, SpecialStatsData } from "./types";

/** 🔧 將來源的中文或大小寫字串統一為英文內部格式 */
export function normalizeType(type: string): "live" | "videos" | "shorts" | null {
  if (!type) return null;

  const t = type.trim().toLowerCase();
  if (t === "直播檔" || t === "直播" || t === "live") return "live";
  if (t === "影片" || t === "video" || t === "videos") return "videos";
  if (t === "shorts" || t === "短片") return "shorts";
  return null;
}

export function computeAnnualReviewStats(allVideos: ClassifiedVideoItem[]): {
  stats: AnnualStatsData;
  special: SpecialStatsData;
} {
  const videoCounts = { shorts: 0, videos: 0, live: 0 };

  const liveVideos = allVideos.filter((v) => normalizeType(v.type) === "live");
  const totalLiveSeconds = liveVideos.reduce(
    (sum, v) => sum + (v.duration ?? 0),
    0
  );

  const monthlyVideoMap = new Map<
    number,
    { shorts: number; videos: number; live: number }
  >();
  const categorySecondsMap = new Map<string, number>();
  const monthlyCategoryMap = new Map<number, Map<string, number>>();

  for (const video of allVideos) {
    const date = new Date(video.publishDate);
    const month = date.getMonth() + 1;

    const normalizedType = normalizeType(video.type);
    if (!normalizedType) continue;

    videoCounts[normalizedType]++;

    if (!monthlyVideoMap.has(month)) {
      monthlyVideoMap.set(month, { shorts: 0, videos: 0, live: 0 });
    }
    monthlyVideoMap.get(month)![normalizedType]++;

    if (normalizedType === "live") {
      const duration = video.duration ?? 0;
      for (const category of video.matchedCategories ?? []) {
        categorySecondsMap.set(
          category,
          (categorySecondsMap.get(category) ?? 0) + duration
        );

        if (!monthlyCategoryMap.has(month)) {
          monthlyCategoryMap.set(month, new Map());
        }
        const categoryMap = monthlyCategoryMap.get(month)!;
        categoryMap.set(category, (categoryMap.get(category) ?? 0) + duration);
      }
    }
  }

  const monthlyVideoCounts = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const data = monthlyVideoMap.get(month) ?? { shorts: 0, videos: 0, live: 0 };
    return { month, ...data };
  });

  const categoryTime = Array.from(categorySecondsMap.entries()).map(
    ([category, seconds]) => ({
      category,
      seconds,
    })
  );

  const monthlyCategoryTime = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const categoryMap = monthlyCategoryMap.get(month) ?? new Map();
    const categoryTimes = Array.from(categoryMap.entries()).map(
      ([category, seconds]) => ({
        category,
        seconds,
      })
    );
    return { month, categoryTimes };
  });

  return {
    stats: {
      videoCounts,
      totalLiveHours: Math.round(totalLiveSeconds / 3600),
      monthlyVideoCounts,
      categoryTime,
      monthlyCategoryTime,
    },
    special: computeSpecialStats(allVideos),
  };
}
