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
