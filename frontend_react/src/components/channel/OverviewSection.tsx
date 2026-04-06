import React, { useMemo } from "react";
import type { ClassifiedVideoItem } from "@/types/category";
import type { VideoType } from "@/utils/filterClassifiedVideos";
import { useChartControlState } from "@/hooks";
import {
    CHART_TYPE_MAP,
    filterChartVideos,
    aggregateVideoMetrics,
} from "@/utils/chartDataUtils";
import CategoryChart from "../chart/CategoryChart";
import ChartSwitcher from "../chart/ChartSwitcher";
import ContentTreemapSection from "../chart/ContentTreemapSection";

interface OverviewSectionProps {
    videos: ClassifiedVideoItem[];
    videoType: VideoType;
    setVideoType: (type: VideoType) => void;
    onCategoryClick?: (category: string) => void;
}

const VIDEO_TYPE_OPTIONS: { key: VideoType; label: string }[] = [
    { key: "live", label: "直播檔" },
    { key: "videos", label: "影片" },
    { key: "shorts", label: "Shorts" },
];

const OverviewSection = ({
    videos,
    videoType,
    setVideoType,
    onCategoryClick,
}: OverviewSectionProps) => {
    const {
        chartType,
        setChartType,
        durationUnit,
        setDurationUnit,
    } = useChartControlState();

    const typeLabel = CHART_TYPE_MAP[videoType];

    const filteredVideos = useMemo(
        () => filterChartVideos(videos, typeLabel, "全部"),
        [videos, typeLabel],
    );

    const { countData, durationData } = useMemo(
        () => aggregateVideoMetrics(videos, typeLabel, "全部"),
        [videos, typeLabel],
    );

    const hasChartData = countData.length > 0 || durationData.length > 0;

    return (
        <div className="px-4 py-4 space-y-6">
            {/* 影片類型 segment + 圖表控制 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-zinc-600 p-0.5 text-sm">
                    {VIDEO_TYPE_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setVideoType(key)}
                            className={`px-3 py-1 rounded-md transition-colors ${
                                videoType === key
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <ChartSwitcher
                    chartType={chartType}
                    setChartType={setChartType}
                    durationUnit={durationUnit}
                    setDurationUnit={setDurationUnit}
                />
            </div>

            {/* 圓餅/長條圖 */}
            {hasChartData ? (
                <CategoryChart
                    countData={countData}
                    durationData={durationData}
                    chartType={chartType}
                    durationUnit={durationUnit}
                    videos={filteredVideos}
                    onCategoryClick={onCategoryClick}
                />
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    目前沒有資料可顯示
                </p>
            )}

            {/* Treemap */}
            <div>
                <h3 className="text-base font-semibold mb-2 dark:text-gray-100">
                    內容分佈
                </h3>
                <ContentTreemapSection videos={filteredVideos} />
            </div>
        </div>
    );
};

export default OverviewSection;
