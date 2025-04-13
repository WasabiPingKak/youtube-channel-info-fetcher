import React, { useState } from "react";
import { GameTagEditor } from "./GameTagEditor";

export const GameTagsGroup = ({ data, setData }) => {
  const [collapsed, setCollapsed] = useState(true);
  const names = Object.keys(data);

  const handleRename = (oldName, newName) => {
    const updated = { ...data };
    updated[newName] = updated[oldName];
    delete updated[oldName];
    setData((prev) => ({
      ...prev,
      game_tags: updated,
    }));
  };

  const handleDelete = (name) => {
    const updated = { ...data };
    delete updated[name];
    setData((prev) => ({
      ...prev,
      game_tags: updated,
    }));
  };

  const handleUpdateKeywords = (name, newKeywords) => {
    const updated = { ...data, [name]: newKeywords };
    setData((prev) => ({
      ...prev,
      game_tags: updated,
    }));
  };

  const handleAddNewGame = () => {
    if (names.includes("")) return;
    setData((prev) => ({
      ...prev,
      game_tags: {
        ...prev.game_tags,
        "": [],
      },
    }));
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-blue-600 hover:underline mb-2"
      >
        {collapsed ? "▶ 展開遊戲標籤設定" : "▼ 收合遊戲標籤設定"}
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {names.length === 0 ? (
            <div className="text-sm text-gray-600 mb-2">
              尚未設定任何遊戲標籤，請點選下方按鈕新增。
            </div>
          ) : (
            names.map((name) => (
              <GameTagEditor
                key={name || `__empty_${Math.random()}`}
                gameName={name}
                keywords={data[name]}
                allNames={names}
                onRename={handleRename}
                onDelete={handleDelete}
                onUpdateKeywords={handleUpdateKeywords}
              />
            ))
          )}
          <button
            onClick={handleAddNewGame}
            className="mt-2 px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
          >
            ➕ 新增遊戲
          </button>
        </div>
      )}
    </div>
  );
};
