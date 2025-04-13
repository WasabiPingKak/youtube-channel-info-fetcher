import React, { useState, useEffect } from "react";
import { KeywordTagsInput } from "./KeywordTagsInput";

export const CategoryEditor = ({
  categoryName,
  keywords,
  allCategories,
  onRename,
  onUpdateKeywords
}) => {
  const [name, setName] = useState(categoryName);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(categoryName);
  }, [categoryName]);

  const handleNameChange = (e) => {
    const newName = e.target.value.trimStart();
    setName(newName);
    if (newName !== categoryName && allCategories.includes(newName)) {
      setError("分類名稱已存在");
    } else {
      setError("");
    }
  };

  const handleBlur = () => {
    const newName = name.trim();
    if (newName && newName !== categoryName && !allCategories.includes(newName)) {
      onRename(categoryName, newName);
    } else {
      setName(categoryName);
    }
  };

  return (
    <div className="border rounded p-4 mb-3 bg-white shadow">
      <div className="flex items-center mb-2">
        <input
          className="border px-2 py-1 mr-2 rounded flex-grow disabled:bg-gray-100"
          value={name}
          onChange={handleNameChange}
          onBlur={handleBlur}
          disabled={categoryName === "其他"}
          placeholder="主分類名稱"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <KeywordTagsInput
        keywords={keywords}
        onChange={(newKeywords) => onUpdateKeywords(categoryName, newKeywords)}
      />
    </div>
  );
};
