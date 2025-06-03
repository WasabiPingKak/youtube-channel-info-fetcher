import React from 'react';
import { ClassifiedVideoItem } from '../../hooks/useClassifiedVideos';

const UnclassifiedVideosPreview = ({ videos = [] }) => {
  const unclassified = videos.filter((v) =>
    v.matchedCategories?.includes("未分類")
  );

  if (unclassified.length === 0) {
    return (
      <div className="bg-gray-100 rounded p-4 mt-6">
        <strong>未分類影片：</strong>
        <p className="text-sm text-gray-500 mt-2">目前無未分類影片</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded p-4 mt-6">
      <strong>未分類影片：</strong>
      <ul className="mt-2 space-y-1">
        {unclassified.map((v) => (
          <li key={v.videoId} className="bg-white p-2 border rounded text-sm">
            {v.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UnclassifiedVideosPreview;
