import React from "react";
import VideoCardDesktop from "./VideoCardDesktop";
import VideoCardMobile from "./VideoCardMobile";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { ClassifiedVideoItem } from "@/types/category";

interface Props {
  video: ClassifiedVideoItem;
  durationUnit: "hours" | "minutes";
}

const VideoCard = ({ video, durationUnit }: Props) => {
  const isMobile = useIsMobile();

  return isMobile ? (
    <VideoCardMobile video={video} durationUnit={durationUnit} />
  ) : (
    <VideoCardDesktop video={video} durationUnit={durationUnit} />
  );
};

export default VideoCard;
