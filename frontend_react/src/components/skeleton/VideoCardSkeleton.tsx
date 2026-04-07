import React from "react";

const VideoCardSkeleton = () => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50 animate-pulse">
        <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-zinc-700" />
            <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-zinc-700/60" />
        </div>
        <div className="flex gap-1.5 shrink-0">
            <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-zinc-700" />
            <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-zinc-700/60" />
        </div>
    </div>
);

interface VideoListSkeletonProps {
    count?: number;
}

export const VideoListSkeleton = ({ count = 8 }: VideoListSkeletonProps) => (
    <div>
        {Array.from({ length: count }, (_, i) => (
            <VideoCardSkeleton key={i} />
        ))}
    </div>
);

export default VideoCardSkeleton;
