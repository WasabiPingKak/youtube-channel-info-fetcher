import React from "react";

const getVideosByIds = (videoIds, videos) =>
  videoIds.map((id) => videos.find((v) => v.videoId === id)).filter(Boolean);

const HeatmapTooltip = ({ label, hour, videoIds, videos }) => {
  const displayedVideos = getVideosByIds(videoIds.slice(0, 3), videos);
  const remainingCount = videoIds.length - displayedVideos.length;

  const formatHourLabel = (hour) => {
    const ampm = hour < 12 ? "上午" : "下午";
    let h = hour % 12;
    if (h === 0) h = 12;
    return `${ampm}${h}點`;
  };

  return (
    <div className="absolute z-10 bg-white border shadow-lg rounded p-3 w-[640px] text-sm text-gray-800 pointer-events-none">
      <div className="font-semibold mb-2">
        星期{label} {formatHourLabel(hour)}
      </div>
      <div className="space-y-3">
        {videoIds.length === 0 ? (
          <div className="text-gray-500">這個時段沒有影片</div>
        ) : (
          <>
            {displayedVideos.map((video) => (
              <div key={video.videoId} className="flex gap-3">
                <img
                  src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                  alt="thumbnail"
                  className="w-32 h-20 rounded object-cover border"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium line-clamp-2">
                    {video.title}
                  </div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    {new Date(video.publishDate).toLocaleString("zh-TW")}
                  </div>
                </div>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="text-blue-500 text-sm mt-1">
                +{remainingCount} 更多
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HeatmapTooltip;
