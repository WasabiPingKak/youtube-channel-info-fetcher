/** 載入中的 skeleton 骨架畫面，模擬 LiveChannelCard 卡片佈局 */
function SkeletonCard() {
    return (
        <div className="flex flex-col border rounded-xl p-4 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 h-full animate-pulse">
            {/* 頻道頭像 + 名稱 */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700" />
                <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-zinc-700" />
                </div>
            </div>

            {/* 狀態文字 */}
            <div className="mt-auto">
                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-zinc-700 mb-2" />

                {/* Badges */}
                <div className="flex gap-1 mb-1">
                    <div className="h-5 w-14 rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-5 w-10 rounded bg-gray-200 dark:bg-zinc-700" />
                </div>

                {/* 縮圖 */}
                <div className="w-full rounded-lg bg-gray-200 dark:bg-zinc-700 aspect-video mb-2" />

                {/* 標題 */}
                <div className="h-4 w-full rounded bg-gray-200 dark:bg-zinc-700 mb-1" />
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-zinc-700 mb-2" />

                {/* 複製按鈕 */}
                <div className="flex gap-2 mt-2">
                    <div className="h-6 w-20 rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-6 w-24 rounded bg-gray-200 dark:bg-zinc-700" />
                </div>
            </div>
        </div>
    );
}

export default function LiveRedirectSkeleton() {
    return (
        <>
            {/* 標題 */}
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse mb-4" />

            {/* 說明按鈕 */}
            <div className="h-9 w-52 rounded bg-gray-100 dark:bg-zinc-800 animate-pulse mb-4" />

            {/* 控制列 */}
            <div className="flex gap-3 mb-4">
                <div className="h-8 w-28 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div className="h-8 w-28 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
            </div>

            {/* Section 標題 */}
            <div className="h-6 w-32 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse mb-3" />

            {/* 卡片 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </>
    );
}
