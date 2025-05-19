import React, { useState } from "react";
import VideoCardSimple from "./VideoCardSimple";

/**
 * @param {Object} props
 * @param {string} props.channelId
 * @param {Object} props.channelInfo
 * @param {Array} props.videos
 */
const ChannelCard = ({ channelId, channelInfo, videos }) => {
  const [expanded, setExpanded] = useState(false);

  const { name, thumbnail, url } = channelInfo || {};
  const first = videos[0];
  const rest = videos.slice(1);

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <div
      onClick={handleToggle}
      className="cursor-pointer border rounded-xl p-3 bg-zinc-50 shadow-sm space-y-3"
    >
      {/* 頻道頭部 */}
      <div className="flex items-center gap-3">
        <img
          src={thumbnail}
          alt={name}
          className="w-8 h-8 rounded-full border"
        />
        <a
          href={url || `https://www.youtube.com/channel/${channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()} // ✅ 避免點到名稱就展開
          className="font-medium text-sm hover:underline"
        >
          {name || channelId}
        </a>
      </div>

      {/* 主影片 + 展開影片 */}
      <div className="space-y-2">
        <VideoCardSimple video={first} />

        {expanded && (
          <div className="space-y-2">
            {rest.map((v) => (
              <VideoCardSimple key={v.videoId} video={v} />
            ))}
          </div>
        )}

        {/* 提示按鈕保留，改為文字提示用途 */}
        {rest.length > 0 && (
          <div
            onClick={(e) => {
              e.stopPropagation(); // ✅ 防止點擊後再傳給整卡片
              handleToggle();
            }}
            className="text-sm text-blue-600 hover:underline ml-1 cursor-pointer"
          >
            {expanded ? "收合其他影片" : `+${rest.length} 更多`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelCard;
