import React, { useMemo, useState } from 'react';
import MatchedVideosPreview from './MatchedVideosPreview';

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

  const matchedCount = useMemo(() => {
    const matched = new Set();

    for (const video of videos) {
      const title = video.title.toLowerCase();
      const base = [name, ...keywords];
      if (base.some((text) => title.includes(text.toLowerCase()))) {
        matched.add(video.videoId);
      }
    }

    return matched.size;
  }, [name, keywords, videos]);

  return (
    <div className="border rounded p-4 mb-4 bg-white shadow-sm">
      {/* 標題 + 命中數 + 編輯/刪除 */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-base font-semibold">
          {name} <span className="text-sm text-gray-500">({matchedCount})</span>
        </div>
        <div className="flex gap-2">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => onEdit?.(name)}
          >
            編輯
          </button>
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={() => setConfirmingDelete(true)}
          >
            刪除
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <div className="mt-2 bg-red-50 border border-red-300 text-sm text-red-800 p-3 rounded">
          <p className="mb-2">確定要刪除子分類「{name}」嗎？此操作無法還原。</p>
          <div className="flex gap-3">
            <button
              className="px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400"
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

      <div className="text-sm mb-1">關鍵字：</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="bg-gray-300 text-sm px-2 py-1 rounded flex items-center"
          >
            {kw}
            <button
              className="ml-1 text-xs text-red-600 hover:text-red-800"
              onClick={() => handleRemoveKeyword(kw)}
              title="移除"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="border px-2 py-1 rounded w-full"
          placeholder="輸入關鍵字並按 Enter"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-blue-600 text-white px-3 rounded"
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
