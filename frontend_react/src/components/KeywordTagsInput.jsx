import React, { useState } from "react";

export const KeywordTagsInput = ({ keywords, onChange }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onChange([...keywords, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDelete = (tag) => {
    onChange(keywords.filter((k) => k !== tag));
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {keywords.map((tag) => (
          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
            {tag}
            <button
              onClick={() => handleDelete(tag)}
              className="ml-1 text-blue-600 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="border px-2 py-1 rounded w-full"
        type="text"
        placeholder="輸入關鍵字後按 Enter 新增"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
