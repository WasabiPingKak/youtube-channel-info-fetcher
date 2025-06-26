import React from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';

interface Props {
  card: SuggestedKeywordCardState;
  showVideos: boolean;
}

const KeywordVideoList: React.FC<Props> = ({ card, showVideos }) => {
  const highlight = (text: string, keyword: string) => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  if (!showVideos) return null;

  return (
    <div>
      <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">
        影片命中數：{card.matchedVideos.length}
      </div>

      <div
        className={`max-h-[300px] overflow-y-auto text-sm rounded px-3 py-2 border
          ${card.skipped
            ? 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-600'
            : 'text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700'
          }`}
      >
        {card.matchedVideos.map((v) => (
          <div key={v.videoId} className="py-2 border-b border-gray-200 dark:border-zinc-700 last:border-none">
            {highlight(v.title, card.keyword)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeywordVideoList;
