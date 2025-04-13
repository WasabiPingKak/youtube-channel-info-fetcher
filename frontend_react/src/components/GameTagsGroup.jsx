import React, { useState } from "react";
import { GameTagEditor } from "./GameTagEditor";

export const GameTagsGroup = ({ data, setData }) => {
  const [collapsed, setCollapsed] = useState(true);
  const names = Object.keys(data || {});

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

  const handleAddNew = () => {
    let newName = "New Game";
    let count = 1;
    while (names.includes(newName)) {
      newName = `New Game ${++count}`;
    }
    const updated = { ...data, [newName]: [] };
    setData((prev) => ({
      ...prev,
      game_tags: updated,
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
        <div>
          {names.length === 0 ? (
            <p className="text-sm text-gray-500 mb-2">尚未設定任何遊戲標籤，請新增。</p>
          ) : (
            <div className="space-y-3 mb-4">
              {names.map((name) => (
                <GameTagEditor
                  key={name}
                  gameName={name}
                  keywords={data[name]}
                  allNames={names}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onUpdateKeywords={handleUpdateKeywords}
                />
              ))}
            </div>
          )}
          <button
            onClick={handleAddNew}
            className="text-sm text-blue-600 hover:underline"
          >
            ＋ 新增遊戲標籤
          </button>
        </div>
      )}
    </div>
  );
};
