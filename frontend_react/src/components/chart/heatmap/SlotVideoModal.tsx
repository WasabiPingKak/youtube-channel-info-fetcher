import React from "react";
import { X, ExternalLink } from "lucide-react";
import type { ClassifiedVideoItem } from "@/types/category";

const getVideosByIds = (videoIds: string[], videos: ClassifiedVideoItem[]): ClassifiedVideoItem[] =>
  videoIds.map((id) => videos.find((v) => v.videoId === id)).filter((v): v is ClassifiedVideoItem => Boolean(v));

interface SlotVideoModalProps {
  label: string;
  hour: number;
  videoIds: string[];
  videos: ClassifiedVideoItem[];
  onClose: () => void;
}

const formatHourLabel = (hour: number) => {
  const ampm = hour < 12 ? "上午" : "下午";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${ampm}${h}點`;
};

const SlotVideoModal = ({ label, hour, videoIds, videos, onClose }: SlotVideoModalProps) => {
  const videoList = getVideosByIds(videoIds, videos);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            星期{label} {formatHourLabel(hour)}
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
              {videoList.length} 部影片
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 清單內容 */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-3 space-y-3">
          {videoList.map((video) => (
            <div
              key={video.videoId}
              className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
            >
              <img
                src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                alt={video.title}
                className="w-36 h-20 rounded-lg object-cover bg-gray-100 dark:bg-zinc-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
                  {video.title}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(video.publishDate).toLocaleString("zh-TW")}
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:underline mt-1.5"
                >
                  <ExternalLink size={11} />
                  YouTube
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlotVideoModal;
