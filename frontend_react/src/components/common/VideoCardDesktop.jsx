// src/components/VideoCard/VideoCardDesktop.jsx
import React from "react";
import VideoBadge from "../common/VideoBadge"; // ✅ 新增引入

// 桌機用影片卡片（橫向排列）
const VideoCardDesktop = ({ video, durationUnit }) => {
  const {
    videoId,
    title,
    publishDate,
    duration,
    game,
    matchedKeywords = [],
    matchedCategories = [],
  } = video;

  // 時長格式化
  const formattedDuration =
    durationUnit === "hours"
      ? `${(duration / 3600).toFixed(1)} 小時`
      : `${Math.round(duration / 60)} 分鐘`;

  // 發布日期格式化
  const formattedDate = publishDate?.slice(0, 10) || "-";

  // ⛏️ 組合分類徽章資訊
  const main = matchedCategories[0] || "未分類";

  const badge = {
    main,
    keyword: main === "遊戲" ? game : matchedKeywords[0],
    tooltip: main === "遊戲" ? matchedKeywords.join(", ") : undefined,
  };

  return (
    <div
      role="row"
      className="flex items-center py-2 px-4 border-b hover:bg-gray-100 transition-colors"
    >
      {/* 標題 */}
      <div
        className="flex-1 min-w-[240px] max-w-[50%] font-semibold truncate"
        title={title}
      >
        {title}
      </div>

      {/* 發布時間 */}
      <div className="basis-28 whitespace-nowrap">{formattedDate}</div>

      {/* 時長 */}
      <div className="basis-28 whitespace-nowrap">{formattedDuration}</div>

      {/* 分類徽章 */}
      <div className="basis-56 truncate">
        <VideoBadge badge={badge} />
      </div>

      {/* 連結 */}
      <div className="w-1/12 text-right">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          前往
        </a>
      </div>
    </div>
  );
};

export default VideoCardDesktop;
