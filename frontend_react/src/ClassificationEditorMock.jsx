import React, { useState } from "react";

const defaultData = {
  channel_id: "UCxxxxxxxxxx",
  classifications: {
    live: {
      雜談: ["雜談", "聊天", "閒聊"],
      遊戲: ["遊戲", "Game"],
      其他: []
    },
    video: {
      教學: ["教學", "攻略"],
      精華: ["剪輯", "精華"],
      其他: []
    },
    shorts: {
      趣味片段: ["迷因", "爆笑"],
      其他: []
    }
  }
};

export default function ClassificationEditorMock() {
  const [channelId] = useState(defaultData.channel_id);
  const [type, setType] = useState("live");
  const [data, setData] = useState(defaultData);

  const handleAddCategory = () => {
    const newName = prompt("輸入新主分類名稱：");
    if (!newName) return;
    setData((prev) => {
      const updated = { ...prev };
      if (!updated.classifications[type][newName]) {
        updated.classifications[type][newName] = [];
      }
      return { ...updated };
    });
  };

  const handleDeleteCategory = (category) => {
    if (category === "其他") return alert("「其他」分類不可刪除");
    if (!window.confirm(`確定刪除主分類「${category}」？`)) return;
    setData((prev) => {
      const updated = { ...prev };
      delete updated.classifications[type][category];
      return { ...updated };
    });
  };

  const handleAddKeyword = (category) => {
    const newKeyword = prompt(`在「${category}」中加入新關鍵字：`);
    if (!newKeyword) return;
    setData((prev) => {
      const updated = { ...prev };
      if (!updated.classifications[type][category].includes(newKeyword)) {
        updated.classifications[type][category].push(newKeyword);
      }
      return { ...updated };
    });
  };

  const handleRemoveKeyword = (category, keyword) => {
    setData((prev) => {
      const updated = { ...prev };
      updated.classifications[type][category] = updated.classifications[type][category].filter(k => k !== keyword);
      return { ...updated };
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">頻道分類管理（假資料測試）</h1>
      <div>
        頻道 ID：<span className="font-mono">{channelId}</span>
      </div>

      <div className="space-x-2">
        {Object.keys(data.classifications).map((t) => (
          <button
            key={t}
            className={`px-3 py-1 rounded ${type === t ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="border p-4 rounded bg-white shadow">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">{type} 分類列表</h2>
          <button onClick={handleAddCategory} className="text-blue-600">＋新增主分類</button>
        </div>

        {Object.entries(data.classifications[type]).map(([category, keywords]) => (
          <div key={category} className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">📁 {category}</span>
              {category !== "其他" && (
                <button onClick={() => handleDeleteCategory(category)} className="text-red-500">刪除</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {keywords.map((kw) => (
                <span key={kw} className="bg-gray-200 px-2 py-1 rounded text-sm">
                  {kw}
                  <button className="ml-1 text-red-600" onClick={() => handleRemoveKeyword(category, kw)}>×</button>
                </span>
              ))}
              <button onClick={() => handleAddKeyword(category)} className="text-blue-600 text-sm">＋新增關鍵字</button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <button
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => alert("儲存資料如下：\n" + JSON.stringify(data, null, 2))}
        >
          ✅ 確認儲存（顯示 JSON）
        </button>
      </div>
    </div>
  );
}
