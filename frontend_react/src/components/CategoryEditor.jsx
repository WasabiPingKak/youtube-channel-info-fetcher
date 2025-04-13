import React, { useState } from "react";

export const CategoryEditor = ({
  categoryName,
  keywords,
  allCategories,
  onRename,
  onDelete,
}) => {
  const [name, setName] = useState(categoryName);
  const [error, setError] = useState("");

  const handleNameChange = (e) => {
    const newName = e.target.value.trim();
    setName(newName);
    if (!newName) return;

    if (newName !== categoryName && allCategories.includes(newName)) {
      setError("分類名稱已存在");
    } else {
      setError("");
      if (newName !== categoryName) {
        onRename(categoryName, newName);
      }
    }
  };

  return (
    <div className="border rounded p-4 mb-3 bg-white shadow">
      <div className="flex items-center mb-2">
        <input
          className="border px-2 py-1 mr-2 rounded flex-grow"
          value={name}
          onChange={handleNameChange}
          placeholder="主分類名稱"
        />
        {categoryName !== "其他" && (
          <button
            onClick={() => onDelete(categoryName)}
            className="text-red-600 hover:underline text-sm"
          >
            刪除
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="text-xs text-gray-500 mt-1">
        （關鍵字輸入欄後續會加在這裡）
      </div>
    </div>
  );
};
