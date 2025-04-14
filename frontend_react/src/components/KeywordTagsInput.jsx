import React from "react";

export default function KeywordTagsInput({ value, onChange }) {
  const handleAddKeyword = () => {
    const newKeyword = prompt("輸入新關鍵字：");
    if (newKeyword && !value.includes(newKeyword)) {
      onChange([...value, newKeyword]);
    }
  };

  const handleRemoveKeyword = (index) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((keyword, index) => (
        <span
          key={index}
          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200"
          onClick={() => handleRemoveKeyword(index)}
        >
          {keyword} ✕
        </span>
      ))}
      <button
        onClick={handleAddKeyword}
        className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        ➕ 新增關鍵字
      </button>
    </div>
  );
}
