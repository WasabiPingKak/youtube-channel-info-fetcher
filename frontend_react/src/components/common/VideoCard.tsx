// src/components/VideoCard/VideoCard.jsx
import React from "react";
import VideoCardDesktop from "./VideoCardDesktop";
import VideoCardMobile from "./VideoCardMobile";
import type { ClassifiedVideoItem } from "@/types/category";

interface Props {
  video: ClassifiedVideoItem;
  durationUnit: "hours" | "minutes";
}

const VideoCard = ({ video, durationUnit }: Props) => {
  const isMobile = window.innerWidth < 768;

  return isMobile ? (
    <VideoCardMobile video={video} durationUnit={durationUnit} />
  ) : (
    <VideoCardDesktop video={video} durationUnit={durationUnit} />
  );
};

export default VideoCard;
