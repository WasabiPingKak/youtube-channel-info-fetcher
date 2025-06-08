import React from "react";
import VideoBadge from "../common/VideoBadge";

const VideoCardMobile = ({ video, durationUnit }) => {
  const {
    videoId,
    title,
    publishDate,
    duration,
    game,
    matchedKeywords = [],
    matchedPairs = [],
  } = video;

  const formattedDuration =
    durationUnit === "hours"
      ? `${(duration / 3600).toFixed(1)} 小時`
      : `${Math.round(duration / 60)} 分鐘`;

  const formattedDate = publishDate?.slice(0, 10) || "-";

  const badges =
    matchedPairs.length > 0
      ? matchedPairs.map((pair) => ({
        main: pair.main,
        keyword: pair.keyword,
        tooltip: pair.main === "遊戲" ? matchedKeywords.join(", ") : undefined,
      }))
      : [{ main: "未分類" }];

  return (
    <div className="px-4 py-3 border-b text-sm space-y-1">
      <div className="font-semibold text-base">{title}</div>
      <div className="text-gray-500">
        📅 {formattedDate} ｜ ⏱️ {formattedDuration}
      </div>
      <div className="flex flex-wrap gap-1">
        {badges.map((badge, index) => (
          <VideoBadge key={index} badge={badge} />
        ))}
      </div>
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
