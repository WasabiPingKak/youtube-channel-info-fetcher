import React from "react";

/**
 * @param {Object} props
 * @param {Object} props.video
 * @param {string} props.video.id
 * @param {string} props.video.title
 * @param {string} props.video.publishedAt
 */
const VideoCardSimple = ({ video }) => {
  const { id, title, publishedAt } = video;

  if (!id || !title) {
    console.warn("⚠️ VideoCardSimple：收到不完整的影片資料", video);
    return null;
  }

  const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;

  const openInNewTab = () => {
    console.log(`🖱️ 開啟影片：${title} (${id})`);
    window.open(videoUrl, "_blank");
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
        onError={() => console.error(`❌ 無法載入縮圖：${thumbnail}`)}
      />
      <div className="flex-1 overflow-hidden">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-gray-400">
          {publishedAt
            ? new Date(publishedAt).toLocaleString()
            : "❓ 發佈時間不明"}
        </div>
      </div>
    </div>
  );
};

export default VideoCardSimple;
