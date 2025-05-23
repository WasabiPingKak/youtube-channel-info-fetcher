import React from "react";

/**
 * @param {Object} props
 * @param {Object} props.video
 * @param {string} props.video.videoId
 * @param {string} props.video.title
 * @param {string} props.video.publishDate
 */
const VideoCardSimple = ({ video }) => {
  const { videoId, title, publishDate } = video;

  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const openInNewTab = () => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

  return (
    <div
      className="flex gap-4 items-start cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
      onClick={openInNewTab}
    >
      <img
        src={thumbnail}
        alt="thumbnail"
        className="w-32 h-20 object-cover rounded-md"
      />
      <div className="flex-1 overflow-hidden">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-gray-400">{new Date(publishDate).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default VideoCardSimple;
