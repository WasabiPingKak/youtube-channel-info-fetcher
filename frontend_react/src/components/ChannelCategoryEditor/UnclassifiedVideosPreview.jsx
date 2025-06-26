import React from 'react';
import { ClassifiedVideoItem } from '../../hooks/useClassifiedVideos';

const UnclassifiedVideosPreview = ({ videos = [] }) => {
  const unclassified = videos.filter((v) =>
    v.matchedCategories?.includes("未分類")
  );

  if (unclassified.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-zinc-800 rounded p-4 mt-6">
        <strong className="text-gray-900 dark:text-gray-100">未分類影片：</strong>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">目前無未分類影片</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-zinc-800 rounded p-4 mt-6">
      <strong className="text-gray-900 dark:text-gray-100">未分類影片：</strong>
      <ul className="mt-2 space-y-1">
        {unclassified.map((v) => (
          <li
            key={v.videoId}
            className="bg-white dark:bg-zinc-900 p-2 border border-gray-300 dark:border-zinc-700 rounded text-sm text-gray-900 dark:text-gray-100"
          >
            {v.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UnclassifiedVideosPreview;
