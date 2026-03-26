import React from "react";
import VideoBadge from "../common/VideoBadge";
import { getBadgesFromClassifiedVideo } from "@/utils/badgeUtils";

const VideoCardDesktop = ({ video, durationUnit }) => {
  const {
    videoId,
    title,
    publishDate,
    duration,
  } = video;

  const formattedDuration =
    durationUnit === "hours"
      ? `${(duration / 3600).toFixed(1)} 小時`
      : `${Math.round(duration / 60)} 分鐘`;

  const formattedDate = publishDate?.slice(0, 10) || "-";

  const badges = getBadgesFromClassifiedVideo(video);

  return (
    <div
      role="row"
      className="flex items-center py-2 px-4 border-b dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
    >
      <div
        className="flex-1 min-w-[240px] max-w-[50%] font-semibold truncate"
        title={title}
      >
        {title}
      </div>
      <div className="basis-28 whitespace-nowrap">{formattedDate}</div>
      <div className="basis-28 whitespace-nowrap">{formattedDuration}</div>
      <div className="basis-56 flex flex-wrap gap-1 truncate">
        {badges.map((badge, index) => (
          <VideoBadge key={index} badge={badge} />
        ))}
      </div>
      <div className="w-1/12 text-right">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          前往
        </a>
      </div>
    </div>
  );
};

export default VideoCardDesktop;
