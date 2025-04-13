import React, { useState, useEffect } from "react";
import { KeywordTagsInput } from "./KeywordTagsInput";

export const GameTagEditor = ({
  gameName,
  keywords,
  allNames,
  onRename,
  onDelete,
  onUpdateKeywords
}) => {
  const [name, setName] = useState(gameName);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(gameName);
  }, [gameName]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);

    const trimmed = newName.trim();
    if (trimmed !== gameName && allNames.includes(trimmed)) {
      setError("遊戲名稱已存在");
    } else {
      setError("");
    }
  };

  const handleBlur = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("遊戲名稱不可為空");
      return;
    }

    if (trimmed !== gameName && !allNames.includes(trimmed)) {
      onRename(gameName, trimmed);
    } else {
      setName(gameName);
    }
  };

  return (
    <div className="border rounded p-4 mb-3 bg-white shadow">
      <div className="flex items-center mb-2">
        <input
          className="border px-2 py-1 mr-2 rounded flex-grow"
          value={name}
          onChange={handleNameChange}
          onBlur={handleBlur}
          placeholder="請輸入遊戲名稱"
        />
        <button
          onClick={() => onDelete(gameName)}
          className="text-red-600 hover:underline text-sm"
        >
          刪除
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <KeywordTagsInput
        keywords={keywords}
        onChange={(newKeywords) => onUpdateKeywords(gameName, newKeywords)}
      />
    </div>
  );
};
