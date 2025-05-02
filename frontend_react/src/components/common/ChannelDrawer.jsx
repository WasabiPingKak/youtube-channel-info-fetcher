// src/components/common/ChannelDrawer.jsx
// -----------------------------------------------------
// 頻道側邊抽屜：顯示 Firestore channel_index 清單，
// 點擊後依照目前頁面 URL 格式（path 或 query）切換頻道，
// 自動更新網址、關閉 Drawer 並顯示切換中 Toast。
// -----------------------------------------------------

import React, { useState } from "react";
import { useChannelList } from "../../hooks/useChannelList";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast"; // 依專案實際 Toast 工具調整 import

// ↙️ Drawer 寬度（Tailwind w-72 ≈ 18rem）
const DRAWER_WIDTH = "w-72";

export default function ChannelDrawer() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* --- 取得頻道清單 --- */
  const { data: channels = [], isLoading, error } = useChannelList();

  /* --- 關閉 Drawer --- */
  const closeDrawer = () => setOpen(false);

  /* --- 選擇頻道後的動作 --- */
  const handleSelect = (channelId, name) => {
    const currentPath = window.location.pathname;

    if (currentPath.startsWith("/editor/")) {
      // 👉 path 模式
      navigate(`/editor/${channelId}`);
    } else {
      // 👉 query string 模式
      const params = new URLSearchParams(searchParams);
      params.set("channel", channelId);
      navigate({ search: params.toString() });
    }

    // 2) 關閉 Drawer
    closeDrawer();

    // 3) 顯示 Toast / Loading
    toast.loading(`正在切換至「${name}」…`, { id: "channel-switch" });
  };

  return (
    <>
      {/* 👉 觸發按鈕（可依需求替換為 Icon） */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="選擇頻道"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 👉 Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />

      {/* 👉 Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${DRAWER_WIDTH} bg-white dark:bg-zinc-900 shadow-lg transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
          <h2 className="text-lg font-semibold">選擇頻道</h2>
          <button onClick={closeDrawer} aria-label="關閉">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 清單區域 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">載入中…</p>
          )}

          {error && (
            <p className="p-4 text-sm text-red-600">讀取失敗：{error.message}</p>
          )}

          {!isLoading && !error && channels.length === 0 && (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
              目前沒有可用的頻道
            </p>
          )}

          <ul>
            {channels.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => handleSelect(c.id, c.name)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <img
                    src={c.thumbnail}
                    alt={c.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
