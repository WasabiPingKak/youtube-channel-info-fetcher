// src/components/VideoCard/VideoCardMobile.jsx
import React from "react";
import VideoBadge from "../common/VideoBadge"; // ✅ 新增匯入

const VideoCardMobile = ({ video, durationUnit }) => {
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

  // ⛏️ 組合分類徽章
  const main = matchedCategories[0] || "未分類";

  const badge = {
    main,
    keyword: main === "遊戲" ? game : matchedKeywords[0],
    tooltip: main === "遊戲" ? matchedKeywords.join(", ") : undefined,
  };

  return (
    <div className="px-4 py-3 border-b text-sm space-y-1">
      {/* 標題 */}
      <div className="font-semibold text-base">{title}</div>

      {/* 發布時間與時長 */}
      <div className="text-gray-500">
        📅 {formattedDate} ｜ ⏱️ {formattedDuration}
      </div>

      {/* 分類徽章 */}
      <div>
        <VideoBadge badge={badge} />
      </div>

      {/* 前往連結 */}
      <div className="text-right pt-1">
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

export default VideoCardMobile;
