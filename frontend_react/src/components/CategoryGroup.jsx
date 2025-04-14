import React from "react";
import KeywordTagsInput from "./KeywordTagsInput";

export default function CategoryGroup({ category, keywords, onChange, disableDelete, onDelete }) {
  return (
    <div className="p-4 border rounded bg-white shadow-sm mb-4">
      <div className="flex items-center mb-2">
        <label className="mr-2 font-semibold">📁 主分類名稱：</label>
        <input
          type="text"
          value={category}
          disabled
          className="flex-1 border px-2 py-1 rounded bg-gray-100 text-gray-600"
        />
        {!disableDelete && (
          <button
            onClick={onDelete}
            className="ml-2 text-sm text-red-600 hover:underline"
          >
            刪除
          </button>
        )}
      </div>
      <div>
        <label className="block font-semibold mb-1">🔑 關鍵字：</label>
        <KeywordTagsInput value={keywords} onChange={onChange} />
      </div>
    </div>
  );
}
