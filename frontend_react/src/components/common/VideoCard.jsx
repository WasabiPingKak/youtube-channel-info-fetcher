import React from "react";

// 單一影片列
const VideoCard = ({ video, durationUnit }) => {
  const {
    videoId,
    title,
    publishDate,
    duration,
    game,
    matchedKeywords = [],
  } = video;

  /* --------------------------- 格式化 --------------------------- */
  // 時長 (秒 → 字串)
  const formattedDuration =
    durationUnit === "hours"
      ? `${(duration / 3600).toFixed(1)} 小時`
      : `${Math.round(duration / 60)} 分鐘`;

  // 日期 (YYYY-MM-DD)
  const formattedDate = publishDate?.slice(0, 10) || "-";

  /* ----------------------------- UI ----------------------------- */
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

      {/* 遊戲 */}
      <div className="basis-28 truncate" title={game || "-"}>
        {game || "-"}
      </div>

      {/* 關鍵字 */}
      <div className="basis-40 truncate" title={matchedKeywords.join(", ") || "-"}>
        {matchedKeywords.length > 0 ? matchedKeywords.join(", ") : "-"}
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

export default VideoCard;
