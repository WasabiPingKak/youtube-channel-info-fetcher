import React from 'react';

const highlightQuery = (text, query) => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i}>{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const MatchedVideosPreview = ({ query, videos = [] }) => {
  if (!query.trim()) return null;

  const lowerQuery = query.toLowerCase();
  const matched = videos.filter((v) =>
    v.title.toLowerCase().includes(lowerQuery)
  );

  if (matched.length === 0) return null;

  return (
    <div className="p-2">
      <strong className="block text-sm mb-2 text-gray-600">
        🔍 命中影片預覽（{matched.length}）
      </strong>
      <ul className="text-sm text-gray-800">
        {matched.map((v, i) => (
          <li key={v.videoId || v.title}>
            <div className="py-1">{highlightQuery(v.title, query)}</div>
            {i < matched.length - 1 && (
              <hr className="border-t border-gray-200 my-1" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchedVideosPreview;
