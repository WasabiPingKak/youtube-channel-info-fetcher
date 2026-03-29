// src/components/video/VideoCardMobile.tsx
import React from "react";
import VideoBadge from "../common/VideoBadge";
import { getBadgesFromClassifiedVideo } from "@/utils/badgeUtils";
import type { ClassifiedVideoItem } from "@/types/category";

interface Props {
  video: ClassifiedVideoItem;
  durationUnit: "hours" | "minutes";
}

const VideoCardMobile = ({ video, durationUnit }: Props) => {
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
    <div className="px-4 py-3 border-b dark:border-zinc-700 text-sm space-y-1">
      <div className="font-semibold text-base">{title}</div>
      <div className="text-gray-500 dark:text-gray-400">
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
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          前往
        </a>
      </div>
    </div>
  );
};

export default VideoCardMobile;
