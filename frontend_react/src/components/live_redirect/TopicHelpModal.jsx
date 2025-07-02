import React from "react";

export default function TopicHelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩（可點擊關閉） */}
      <div
        className="fixed inset-0 bg-black opacity-50 z-0"
        onClick={onClose}
      ></div>

      {/* Modal 內容本體 */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 max-w-md w-full z-10">
        <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
          🔍 分類徽章是怎麼產生的？
        </h2>

        <div className="text-sm text-gray-700 dark:text-gray-200 space-y-4">
          <p>
            每場直播的標題，會自動比對以下四個來源的關鍵字清單：
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>分類總表｜遊戲</li>
            <li>分類總表｜主題</li>
            <li>自訂影片分類｜快速模式</li>
            <li>自訂影片分類｜進階模式</li>
          </ul>
          <p>
            只要標題中出現任何一個符合的關鍵字，就會自動套上對應的主題分類徽章（例如「遊戲」「雜談」「節目」等）。
            若標題沒有命中任何分類條件，就會顯示為「無法分類」。
          </p>

          <hr className="border-t border-gray-300 dark:border-zinc-600" />

          <p>
            你可以透過以下方式補充分類關鍵字：
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>在「遊戲總表」中新增遊戲名稱</li>
            <li>在右上角「頻道自訂影片分類」中新增分類關鍵字</li>
          </ul>
          <p>
            自訂的關鍵字只會套用在你自己頻道的直播標題，不會影響其他人。
            不過這些分類的結果會被系統記錄，並同時應用在以下幾個地方：
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li> 降落轉機塔臺</li>
            <li> 頻道遊戲趨勢</li>
            <li> 頻道分析頁</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1 text-sm font-medium bg-gray-200 dark:bg-zinc-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-zinc-500 transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
