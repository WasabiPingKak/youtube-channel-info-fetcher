import React from "react";
import KeywordTagsInput from "./KeywordTagsInput";

export default function CategoryGroup({ category, keywords, onChange, onRename, disableDelete, disableEditName, onDelete, onDirty }) {
  const handleRename = (e) => {
    const newName = e.target.value;
    if (newName !== category && onRename) {
      onRename(newName);
    }
    if (onDirty) onDirty();
  };

  return (
    <div className="p-4 border rounded bg-white shadow-sm mb-4">
      <div className="flex items-center mb-2">
        <label className="mr-2 font-semibold">📁 主分類名稱：</label>
        <input
          type="text"
          defaultValue={category}
          onBlur={handleRename}
          disabled={disableEditName}
          className={`flex-1 border px-2 py-1 rounded ${
            disableEditName ? "bg-gray-100 text-gray-500" : ""
          }`}
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
