import React from 'react';

const MatchedVideosPreview = ({ query, videos = [] }) => {
  if (!query.trim()) return null;

  const lowerQuery = query.toLowerCase();
  const matched = videos.filter((v) =>
    v.title.toLowerCase().includes(lowerQuery)
  );

  if (matched.length === 0) return null;

  return (
    <div className="p-2">
      <strong className="block text-sm mb-2">
        命中影片預覽（{matched.length}）
      </strong>
      <ul className="space-y-1">
        {matched.map((v) => (
          <li
            key={v.videoId || v.title}
            className="bg-white p-2 border rounded text-sm"
          >
            🎬 {v.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchedVideosPreview;
