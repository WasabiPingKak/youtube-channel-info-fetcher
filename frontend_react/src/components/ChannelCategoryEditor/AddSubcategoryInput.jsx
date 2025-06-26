import React from 'react';
import MatchedVideosPreview from './MatchedVideosPreview';

const AddSubcategoryInput = ({
  newSubcatName,
  setNewSubcatName,
  onAddSubcategory,
  videos = [],
}) => {
  return (
    <div className="mb-8">
      <div className="flex gap-2">
        <input
          className="border border-gray-300 dark:border-zinc-600 px-3 py-2 rounded w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          type="text"
          placeholder="輸入新的子分類名稱..."
          value={newSubcatName}
          onChange={(e) => setNewSubcatName(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={onAddSubcategory}
        >
          ➕ 新增子分類
        </button>
      </div>

      {/* 即時命中預覽 */}
      <MatchedVideosPreview query={newSubcatName} videos={videos} />
    </div>
  );
};

export default AddSubcategoryInput;
