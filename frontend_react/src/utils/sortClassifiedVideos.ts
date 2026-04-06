import type { ClassifiedVideoItem } from "@/types/category";

export const SORT_FIELDS = {
    TITLE: "title",
    PUBLISH_DATE: "publishDate",
    DURATION: "duration",
    GAME: "game",
    KEYWORDS: "keywords",
} as const;

export type SortField = (typeof SORT_FIELDS)[keyof typeof SORT_FIELDS];
export type SortOrder = "asc" | "desc";

const getVal = (
    video: ClassifiedVideoItem,
    field: SortField,
): string | number => {
    switch (field) {
        case SORT_FIELDS.TITLE:
            return video.title;
        case SORT_FIELDS.PUBLISH_DATE:
            return video.publishDate;
        case SORT_FIELDS.DURATION:
            return video.duration;
        case SORT_FIELDS.GAME:
            return video.game || "-";
        case SORT_FIELDS.KEYWORDS:
            return (video.matchedKeywords?.length ?? 0) > 0
                ? video.matchedKeywords!.join(", ")
                : "-";
        default:
            return "";
    }
};

/**
 * 排序已分類影片，支援日期、時長、中文字串、遊戲名稱、關鍵字
 * 缺值（"-"）在 asc 時推到尾端、desc 時推到前端
 */
export const sortClassifiedVideos = (
    videos: ClassifiedVideoItem[],
    sortField: SortField,
    sortOrder: SortOrder,
): ClassifiedVideoItem[] => {
    const direction = sortOrder === "asc" ? 1 : -1;

    return [...videos].sort((a, b) => {
        const valA = getVal(a, sortField);
        const valB = getVal(b, sortField);

        if (sortField === SORT_FIELDS.PUBLISH_DATE) {
            return (
                (new Date(valA as string).getTime() -
                    new Date(valB as string).getTime()) *
                direction
            );
        }
        if (sortField === SORT_FIELDS.DURATION) {
            return ((valA as number) - (valB as number)) * direction;
        }

        const isMissingA = valA === "-";
        const isMissingB = valB === "-";
        if (isMissingA && isMissingB) return 0;
        if (isMissingA) return sortOrder === "asc" ? 1 : -1;
        if (isMissingB) return sortOrder === "asc" ? -1 : 1;

        return (
            (valA as string).localeCompare(
                valB as string,
                "zh-Hant-u-co-stroke",
            ) * direction
        );
    });
};
