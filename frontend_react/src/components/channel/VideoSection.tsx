import React, { useEffect } from "react";
import type { ClassifiedVideoItem } from "@/types/category";
import type { SortField } from "@/utils/sortClassifiedVideos";
import { useVideoBrowseState } from "@/hooks";
import { VideoCard } from "../common";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getCategoryColorScheme } from "@/utils/categoryColors";
import { VideoListSkeleton } from "@/components/skeleton/VideoCardSkeleton";

interface VideoSectionProps {
    videos: ClassifiedVideoItem[];
    loading: boolean;
    error: Error | null;
    initialCategory?: string | null;
}

const CATEGORIES = ["全部", "遊戲", "雜談", "節目", "音樂", "未分類"];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: "publishDate", label: "發布時間" },
    { value: "duration", label: "時長" },
    { value: "title", label: "標題" },
    { value: "game", label: "遊戲" },
];

const VideoSection = ({
    videos,
    loading,
    error,
    initialCategory,
}: VideoSectionProps) => {
    const {
        videoType,
        setVideoType,
        activeCategory,
        setActiveCategory,
        sortField,
        sortOrder,
        handleSort,
        filteredVideos,
        SORT_FIELDS,
    } = useVideoBrowseState(videos);

    // 從外部跳轉帶入的分類
    useEffect(() => {
        if (initialCategory) {
            setActiveCategory(initialCategory);
        }
    }, [initialCategory, setActiveCategory]);

    return (
        <div className="px-4 py-4">
            {/* 一行 filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* 影片類型 segment */}
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-zinc-600 p-0.5 text-sm">
                    {(["live", "videos", "shorts"] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setVideoType(type)}
                            className={`px-2.5 py-1 rounded-md transition-colors ${
                                videoType === type
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                            }`}
                        >
                            {{ live: "直播檔", videos: "影片", shorts: "Shorts" }[type]}
                        </button>
                    ))}
                </div>

                {/* 分類 chips */}
                <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat;
                        if (cat === "全部") {
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                        isActive
                                            ? "bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900"
                                            : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        }
                        const colors = getCategoryColorScheme(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    isActive
                                        ? `${colors.bg} ${colors.text}`
                                        : `${colors.bgMuted} ${colors.textMuted} ${colors.bgMutedDark} ${colors.textMutedDark} hover:opacity-80`
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* 排序 dropdown + 升降冪 */}
                <div className="flex items-center gap-1 ml-auto">
                    <select
                        value={sortField}
                        onChange={(e) => handleSort(e.target.value as SortField)}
                        className="text-sm border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                    >
                        {SORT_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => handleSort(sortField)}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-400"
                        title={sortOrder === "asc" ? "升冪排序" : "降冪排序"}
                    >
                        {sortOrder === "asc"
                            ? <ChevronUp size={14} />
                            : <ChevronDown size={14} />
                        }
                    </button>
                </div>
            </div>

            {/* 影片數量 */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                共 {filteredVideos.length} 部影片
            </div>

            {/* 狀態訊息 */}
            {loading && (
                <VideoListSkeleton />
            )}
            {error && (
                <p className="text-red-600 dark:text-red-400 py-4">
                    錯誤：{error.message}
                </p>
            )}
            {!loading && !error && filteredVideos.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                    目前無影片。若是剛連結頻道的新用戶，資料庫初始化可能需等待數十分鐘。
                    <br />
                    若連結已超過一天仍無任何資料，請聯絡管理者協助處理。
                </p>
            )}

            {/* 影片列表 */}
            <div className="space-y-0">
                {filteredVideos.map((video) => (
                    <VideoCard
                        key={video.videoId}
                        video={video}
                        durationUnit="minutes"
                    />
                ))}
            </div>
        </div>
    );
};

export default VideoSection;
