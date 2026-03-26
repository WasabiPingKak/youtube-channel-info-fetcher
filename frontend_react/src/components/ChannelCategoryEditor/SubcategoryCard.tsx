import React, { useMemo, useState } from 'react';
import MatchedVideosPreview from './MatchedVideosPreview';

const highlightMatchedText = (text, keywords) => {
  if (!keywords.length) return text;

  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        keywords.some(k => k.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-yellow-200">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const SubcategoryCard = ({
  name,
  keywords,
  onKeywordsChange,
  onDelete,
  onEdit,
  videos = [],
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onKeywordsChange([...keywords, trimmed]);
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw) => {
    onKeywordsChange(keywords.filter((k) => k !== kw));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddKeyword();
    }
  };

  const { matchedVideos, count } = useMemo(() => {
    const result = [];
    const baseKeywords = [name, ...keywords].map(k => k.toLowerCase());

    for (const video of videos) {
      const title = video.title.toLowerCase();
      if (baseKeywords.some(k => title.includes(k))) {
        result.push(video);
      }
    }

    return { matchedVideos: result, count: result.length };
  }, [name, keywords, videos]);

  return (
    <div className="border border-gray-300 dark:border-zinc-600 rounded p-4 mb-4 bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-gray-100">
      {/* 標題列 */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-base font-semibold flex items-center gap-2">
          {name}
          <span className="text-sm text-gray-500 dark:text-gray-400">({count})</span>
          <button
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setIsExpanded(prev => !prev)}
          >
            {isExpanded ? '收合影片' : '顯示影片'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => onEdit?.(name)}
          >
            編輯
          </button>
          <button
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
            onClick={() => setConfirmingDelete(true)}
          >
            刪除
          </button>
        </div>
      </div>

      {/* 命中影片列表 */}
      {isExpanded && (
        <div className="border border-gray-200 dark:border-zinc-600 rounded mb-3 p-2 bg-gray-50 dark:bg-zinc-700 max-h-60 overflow-y-auto text-sm divide-y divide-gray-200 dark:divide-zinc-600">
          {matchedVideos.map((video) => (
            <div key={video.videoId} className="py-2">
              {highlightMatchedText(video.title, [name, ...keywords])}
            </div>
          ))}
        </div>
      )}

      {/* 刪除確認 */}
      {confirmingDelete && (
        <div className="mt-2 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-400 text-sm text-red-800 dark:text-red-300 p-3 rounded">
          <p className="mb-2">確定要刪除子分類「{name}」嗎？此操作無法還原。</p>
          <div className="flex gap-3">
            <button
              className="px-3 py-1 text-sm bg-gray-300 dark:bg-zinc-600 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-zinc-500"
              onClick={() => setConfirmingDelete(false)}
            >
              取消
            </button>
            <button
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => {
                onDelete();
                setConfirmingDelete(false);
              }}
            >
              確定刪除
            </button>
          </div>
        </div>
      )}

      {/* 關鍵字 */}
      <div className="text-sm mb-1">關鍵字：</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="bg-gray-300 dark:bg-zinc-600 text-sm px-2 py-1 rounded flex items-center text-gray-900 dark:text-white"
          >
            {kw}
            <button
              className="ml-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              onClick={() => handleRemoveKeyword(kw)}
              title="移除"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* 新增關鍵字 */}
      <div className="flex gap-2">
        <input
          type="text"
          className="border border-gray-300 dark:border-zinc-600 px-2 py-1 rounded w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="輸入關鍵字並按 Enter"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
          onClick={handleAddKeyword}
        >
          ➕
        </button>
      </div>

      <MatchedVideosPreview query={newKeyword} videos={videos} />
    </div>
  );
};

export default SubcategoryCard;
