export interface ClassifiedVideoItem {
    videoId: string;
    title: string;
    publishDate: string;
    duration: number;
    type: "live" | "videos" | "shorts";
    matchedCategories: string[];
    game?: string | null;
    matchedKeywords?: string[];
    matchedPairs?: { main: string; keyword: string; hitKeywords: string[] }[];
    [key: string]: any;
}

export interface SuggestedKeywordCardState {
    keyword: string;
    count: number;
    agreed: boolean;
    skipped: boolean;
    subcategoryName: string;
    isSaving?: boolean;
    isSuccess?: boolean;
    mainCategories: string[];
    matchedVideos: ClassifiedVideoItem[];
}
