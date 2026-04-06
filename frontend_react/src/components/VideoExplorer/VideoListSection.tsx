import React from "react";
import type { ClassifiedVideoItem } from "@/types/category";
import type { SortField, SortOrder } from "@/utils/sortClassifiedVideos";
import { VideoCard } from "../common";
import VideoTableHeader from "./VideoTableHeader";
import MobileSortDropdown from "./MobileSortDropdown";

interface VideoListSectionProps {
    videos: ClassifiedVideoItem[];
    loading: boolean;
    error: Error | null;
    activeCategory: string;
    sortField: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField) => void;
    durationUnit: "hours" | "minutes";
}

const VideoListSection = ({
    videos,
    loading,
    error,
    activeCategory,
    sortField,
    sortOrder,
    onSort,
    durationUnit,
}: VideoListSectionProps) => {
    return (
        <>
            <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                {activeCategory
                    ? `共顯示 ${videos.length} 部影片`
                    : "請選擇分類"}
            </div>

            {loading && (
                <p className="px-4 text-gray-500 dark:text-gray-300">
                    載入中...
                </p>
            )}
            {error && (
                <p className="px-4 text-red-600 dark:text-red-400">
                    錯誤：{error.message}
                </p>
            )}
            {!loading &&
                !error &&
                videos.length === 0 &&
                activeCategory && (
                    <p className="px-4 text-gray-500 dark:text-gray-400">
                        目前無影片。若是剛連結頻道的新用戶，資料庫初始化可能需等待數十分鐘。
                        <br />
                        若連結已超過一天仍無任何資料，請聯絡管理者協助處理。
                    </p>
                )}

            <VideoTableHeader
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={(field: string) => onSort(field as SortField)}
            />

            <MobileSortDropdown
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={(field: string) => onSort(field as SortField)}
                onToggleOrder={() => onSort(sortField)}
            />

            {videos.map((video) => (
                <VideoCard
                    key={video.videoId}
                    video={video}
                    durationUnit={durationUnit}
                />
            ))}
        </>
    );
};

export default VideoListSection;
