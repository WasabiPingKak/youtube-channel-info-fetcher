// src/components/VideoCard/VideoCard.jsx
import React from "react";
import VideoCardDesktop from "./VideoCardDesktop";
import VideoCardMobile from "./VideoCardMobile";

const VideoCard = ({ video, durationUnit }) => {
  const isMobile = window.innerWidth < 768;

  return isMobile ? (
    <VideoCardMobile video={video} durationUnit={durationUnit} />
  ) : (
    <VideoCardDesktop video={video} durationUnit={durationUnit} />
  );
};

export default VideoCard;
