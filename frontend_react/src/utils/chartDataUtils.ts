import type { ClassifiedVideoItem } from "@/types/category";

export interface CategoryCount {
    category: string;
    count: number;
}

export interface CategoryDuration {
    category: string;
    duration: number;
}

export const getCategoryStats = (videos: ClassifiedVideoItem[]): { countData: CategoryCount[]; durationData: CategoryDuration[] } => {
    const countMap = new Map<string, number>();
    const durationMap = new Map<string, number>();

    for (const video of videos) {
        const categories = video.matchedCategories || ["其他"];
        const duration = (video.duration || 0) / 60; // 轉成分鐘

        for (const category of categories) {
            countMap.set(category, (countMap.get(category) || 0) + 1);
            durationMap.set(category, (durationMap.get(category) || 0) + duration);
        }
    }

    const countData: CategoryCount[] = Array.from(countMap, ([category, count]) => ({ category, count }));
    const durationData: CategoryDuration[] = Array.from(durationMap, ([category, duration]) => ({ category, duration: Math.round(duration) }));

    return { countData, durationData };
};

// ===== 圖表用影片篩選 =====

export const CHART_TYPE_MAP: Record<string, string> = {
    live: "直播檔",
    videos: "影片",
    shorts: "Shorts",
};

/**
 * 篩選影片供圖表顯示。
 * 與 filterClassifiedVideos 不同：遊戲分類額外檢查 video.game 是否存在。
 */
export const filterChartVideos = (
    videos: ClassifiedVideoItem[],
    typeLabel: string,
    activeCategory: string,
): ClassifiedVideoItem[] => {
    return videos.filter((video) => {
        if (video.type !== typeLabel) return false;
        if (activeCategory === "全部") return true;
        if (activeCategory === "遊戲") return Boolean(video.game);
        return video.matchedCategories?.includes(activeCategory);
    });
};

// ===== 計數聚合 =====

interface CategoryMetric {
    category: string;
    count: number;
    duration: number;
}

/**
 * 依 activeCategory 聚合影片的次數與時長。
 *
 * - 「全部」：依 matchedCategories 分組
 * - 「遊戲」：依 video.game 分組
 * - 其他：依 matchedPairs 中符合的 keyword 分組
 *
 * 結果排序：未分類永遠在最後，其餘依 count 降冪。
 */
export const aggregateVideoMetrics = (
    videos: ClassifiedVideoItem[],
    typeLabel: string,
    activeCategory: string,
    showAllKeywords: boolean = false,
): { countData: CategoryCount[]; durationData: CategoryDuration[] } => {
    const counts: Record<string, CategoryMetric> = {};

    const ensure = (key: string) => {
        if (!counts[key]) counts[key] = { category: key, count: 0, duration: 0 };
    };

    videos.forEach((video) => {
        if (video.type !== typeLabel) return;

        const isGame = activeCategory === "遊戲";
        const isAll = activeCategory === "全部";
        const isSpecific = !isGame && !isAll;

        if (isGame && video.game) {
            const key = video.game;
            ensure(key);
            counts[key].count += 1;
            counts[key].duration += video.duration || 0;
        } else if (isSpecific && Array.isArray(video.matchedPairs)) {
            const seen = new Set<string>();
            video.matchedPairs.forEach(({ keyword, main }) => {
                if (main !== activeCategory) return;
                if (!showAllKeywords && seen.has(keyword)) return;
                seen.add(keyword);
                ensure(keyword);
                counts[keyword].count += 1;
                counts[keyword].duration += video.duration || 0;
            });
        } else if (isAll && Array.isArray(video.matchedCategories)) {
            video.matchedCategories.forEach((cat) => {
                ensure(cat);
                counts[cat].count += 1;
                counts[cat].duration += video.duration || 0;
            });
        }
    });

    const sorted = Object.values(counts).sort((a, b) => {
        if (a.category === "未分類") return 1;
        if (b.category === "未分類") return -1;
        return b.count - a.count;
    });

    return {
        countData: sorted.map((d) => ({ category: d.category, count: d.count })),
        durationData: sorted.map((d) => ({ category: d.category, duration: d.duration || 0 })),
    };
};

// ===== 時長單位轉換 =====

/**
 * 將秒數轉為指定單位的數值。
 * - hours：保留一位小數
 * - minutes：四捨五入為整數
 */
export const convertDurationUnit = (
    seconds: number,
    unit: "hours" | "minutes",
): number => {
    if (unit === "hours") return +(seconds / 3600).toFixed(1);
    return Math.round(seconds / 60);
};
