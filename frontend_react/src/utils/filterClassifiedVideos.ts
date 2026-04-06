import type { ClassifiedVideoItem } from "@/types/category";

export type VideoType = "live" | "videos" | "shorts";

export const VIDEO_TYPE_MAP: Record<VideoType, string> = {
    live: "直播檔",
    videos: "影片",
    shorts: "Shorts",
};

/**
 * 依影片類型與分類篩選已分類影片
 */
export const filterClassifiedVideos = (
    videos: ClassifiedVideoItem[],
    videoType: VideoType,
    activeCategory: string,
): ClassifiedVideoItem[] => {
    const expectedType = VIDEO_TYPE_MAP[videoType];

    return videos.filter((video) => {
        const matchesType = video.type === expectedType;
        if (activeCategory === "全部") return matchesType;
        const matchesCategory =
            activeCategory &&
            video.matchedPairs?.some((pair) => pair.main === activeCategory);
        return matchesType && matchesCategory;
    });
};
