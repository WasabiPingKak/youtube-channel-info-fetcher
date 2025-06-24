import React from "react";

export default function LiveRedirectHelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal 內容 */}
      <div className="relative z-10 bg-white dark:bg-zinc-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          🛬 什麼是「降落轉機塔臺」？
        </h2>

        <p className="text-sm text-gray-800 dark:text-gray-200">
          本頁面會顯示目前正在直播、即將開台，或剛結束直播的頻道，讓想降落的主播能快速找到停機坪。
        </p>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
          ✅ 顯示條件
        </h3>
        <ul className="list-disc text-sm text-gray-700 dark:text-gray-300 pl-5 space-y-1">
          <li>您已在本站連結自己的頻道</li>
          <li>已在「我的頻道設定」中開啟「願意公開我正在直播中的狀態」</li>
          <li>只要直播為公開狀態，連結後的下一次直播即會自動生效</li>
          <li>符合條件後，每次開台就會自動出現在此頁，不用提早一天開待機室</li>
        </ul>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-4">
          📡 顯示分類
        </h3>
        <ul className="list-disc text-sm text-gray-700 dark:text-gray-300 pl-5 space-y-1">
          <li>即將直播：預計 <strong>15 分鐘內</strong> 開播的預約直播</li>
          <li>正在直播：已實際開播且尚未結束的直播</li>
          <li>已收播：12 小時內已結束的直播（預設隱藏）</li>
        </ul>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          ※ 資料每 <strong>15 分鐘</strong> 自動更新一次
        </p>

        <div className="text-right mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            關閉
          </button>
        </div>
      </div>

    </div>
  );
}
