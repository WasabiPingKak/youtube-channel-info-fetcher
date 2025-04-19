import React from "react";

const VideoCard = ({ video, durationUnit }) => {
  const {
    videoId,
    title,
    publishDate,
    duration,
    game,
    matchedKeywords = [],
  } = video;

  // 格式化時長
  const formattedDuration =
    durationUnit === "hours"
      ? `${(duration / 3600).toFixed(1)} 小時`
      : `${Math.round(duration / 60)} 分鐘`;

  // 格式化日期（只保留 YYYY-MM-DD）
  const formattedDate = publishDate?.slice(0, 10) || "-";

  return (
    <div
      className="flex justify-between items-center py-2 px-4 border-b hover:bg-gray-100 transition-colors"
    >
      <div className="w-1/4 font-semibold truncate" title={title}>
        {title}
      </div>
      <div className="w-1/6">{formattedDate}</div>
      <div className="w-1/6">{formattedDuration}</div>
      <div className="w-1/6">{game || "-"}</div>
      <div className="w-1/6">
        {matchedKeywords.length > 0 ? matchedKeywords.join(", ") : "-"}
      </div>
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

export default VideoCard;
