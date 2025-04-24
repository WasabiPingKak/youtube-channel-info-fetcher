import React, { useState } from "react";
import GameTagEditor from "./GameTagEditor";

export default function GameTagsGroup({ gameTags, onChange }) {
  const [collapsed, setCollapsed] = useState(true);

  const handleGameChange = (index, newGame) => {
    const updated = [...gameTags];
    updated[index] = newGame;
    onChange(updated);
  };

  const handleDelete = (index) => {
    const updated = [...gameTags];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleAddGame = () => {
    onChange([...gameTags, { game: "", keywords: [] }]);
  };

  return (
    <div className="border rounded-xl p-4 bg-gray-50">
      <div
        className="cursor-pointer select-none font-bold text-lg mb-2"
        onClick={() => setCollapsed(!collapsed)}
      >
        🎮 遊戲分類 {collapsed ? "(點擊展開)" : "(點擊收合)"}
      </div>
      {!collapsed && (
        <div className="space-y-4">
          {gameTags.map((item, index) => (
            <GameTagEditor
              key={index}
              game={item.game}
              keywords={item.keywords}
              onChange={(newGame) => handleGameChange(index, newGame)}
              onDelete={() => handleDelete(index)}
            />
          ))}
          <button
            onClick={handleAddGame}
            className="mt-2 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            ➕ 新增遊戲
          </button>
        </div>
      )}
    </div>
  );
}
