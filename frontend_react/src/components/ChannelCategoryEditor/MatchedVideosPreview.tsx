import React from 'react';
import { ClassifiedVideoItem } from '@/types/category';

const highlightQuery = (text: string, query: string) => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

interface Props {
  query: string;
  videos?: ClassifiedVideoItem[];
}

const MatchedVideosPreview = ({ query, videos = [] }: Props) => {
  if (!query.trim()) return null;

  const lowerQuery = query.toLowerCase();
  const matched = videos.filter((v) =>
    v.title.toLowerCase().includes(lowerQuery)
  );

  if (matched.length === 0) return null;

  return (
    <div className="p-2 border border-gray-200 dark:border-zinc-600 rounded bg-gray-50 dark:bg-zinc-800 mt-3">
      <strong className="block text-sm mb-2 text-gray-600 dark:text-gray-300">
        🔍 命中影片預覽（{matched.length}）
      </strong>
      <ul className="text-sm text-gray-800 dark:text-gray-100">
        {matched.map((v, i) => (
          <li key={v.videoId || v.title}>
            <div className="py-1">{highlightQuery(v.title, query)}</div>
            {i < matched.length - 1 && (
              <hr className="border-t border-gray-200 dark:border-zinc-700 my-1" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchedVideosPreview;
