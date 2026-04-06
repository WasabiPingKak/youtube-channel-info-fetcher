import React from "react";
import type { ClassifiedVideoItem } from "@/types/category";
import VideoUploadHeatmap from "../chart/VideoUploadHeatmap";

interface HeatmapSectionProps {
    channelId: string;
    videos: ClassifiedVideoItem[];
}

const HeatmapSection = ({ channelId, videos }: HeatmapSectionProps) => {
    return (
        <div className="px-4 py-4">
            <VideoUploadHeatmap channelId={channelId} videos={videos} />
        </div>
    );
};

export default HeatmapSection;
