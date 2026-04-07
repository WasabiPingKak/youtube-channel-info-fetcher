import React from "react";

const ChannelCardSkeleton = () => (
    <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-700" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-gray-200 dark:bg-zinc-700" />
                <div className="h-3 w-20 rounded bg-gray-100 dark:bg-zinc-700/60" />
            </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-700/60" />
    </div>
);

interface ChannelGridSkeletonProps {
    count?: number;
}

export const ChannelGridSkeleton = ({ count = 9 }: ChannelGridSkeletonProps) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: count }, (_, i) => (
            <ChannelCardSkeleton key={i} />
        ))}
    </div>
);

export default ChannelCardSkeleton;
