import React from "react";

const getVideosByIds = (videoIds, videos) =>
  videoIds.map((id) => videos.find((v) => v.videoId === id)).filter(Boolean);

const SlotVideoModal = ({ label, hour, videoIds, videos, onClose }) => {
  const videoList = getVideosByIds(videoIds, videos);

  const formatHourLabel = (hour) => {
    const ampm = hour < 12 ? "上午" : "下午";
    let h = hour % 12;
    if (h === 0) h = 12;
    return `${ampm}${h}點`;
  };

  // 用來避免點內部卡片時觸發關閉
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded shadow-xl overflow-hidden"
        onClick={stopPropagation}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">
            星期{label} {formatHourLabel(hour)} 的影片清單
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ×
          </button>
        </div>

        {/* 清單內容 */}
        <div className="h-[70vh] overflow-y-auto px-4 py-3 space-y-4">
          {videoList.map((video) => (
            <div key={video.videoId} className="flex gap-4">
              <img
                src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                alt="thumbnail"
                className="w-40 h-24 rounded object-cover border"
              />
              <div className="flex-1">
                <div className="text-base font-medium">{video.title}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(video.publishDate).toLocaleString("zh-TW")}
                </div>
                <div className="mt-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    前往 YouTube
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlotVideoModal;
