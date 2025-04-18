import React from "react";
import KeywordTagsInput from "./KeywordTagsInput";

export default function GameTagEditor({ game, keywords, onChange, onDelete }) {
  const handleGameNameChange = (e) => {
    onChange({ game: e.target.value, keywords });
  };

  const handleKeywordsChange = (newKeywords) => {
    onChange({ game, keywords: newKeywords });
  };

  return (
    <div className="p-4 border rounded bg-white shadow-md">
      <div className="flex items-center mb-2">
        <label className="mr-2 font-semibold">🎮 遊戲名稱：</label>
        <input
          type="text"
          value={game}
          onChange={handleGameNameChange}
          className="flex-1 border px-2 py-1 rounded"
          placeholder="例如：Minecraft"
        />
        <button
          onClick={onDelete}
          className="ml-2 text-sm text-red-600 hover:underline"
        >
          刪除
        </button>
      </div>
      <div>
        <label className="block font-semibold mb-1">🔑 關鍵字：</label>
        <KeywordTagsInput value={keywords} onChange={handleKeywordsChange} />
      </div>
    </div>
  );
}
