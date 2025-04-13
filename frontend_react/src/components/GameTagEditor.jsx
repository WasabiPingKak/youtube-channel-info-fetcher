import React, { useState } from "react";
import { KeywordTagsInput } from "./KeywordTagsInput";

export const GameTagEditor = ({ gameName, keywords, allNames, onRename, onDelete, onUpdateKeywords }) => {
  const [name, setName] = useState(gameName);
  const [error, setError] = useState("");

  const handleNameChange = (e) => {
    const newName = e.target.value.trim();
    setName(newName);
    if (!newName) return;

    if (newName !== gameName && allNames.includes(newName)) {
      setError("遊戲名稱已存在");
    } else {
      setError("");
      if (newName !== gameName) {
        onRename(gameName, newName);
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
          placeholder="遊戲名稱"
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
