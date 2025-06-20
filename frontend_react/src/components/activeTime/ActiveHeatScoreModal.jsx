import React from "react";

export default function ActiveHeatScoreModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal 內容 */}
      <div className="relative z-10 bg-white dark:bg-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          🟣 活躍熱度的計算方式說明
        </h2>

        <p>
          VTuber 頻道的「活躍熱度」是用來比較在指定時段內的活躍程度，計算邏輯如下：
        </p>

        <h3 className="text-lg font-semibold mt-4">🔢 活躍數據來源</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>每一週的「星期幾」（如：Mon, Tue, ...）</li>
          <li>每天 24 小時中每一小時的活躍次數（例如上傳影片、直播出現）</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">🧮 計算步驟</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong>找出該頻道活躍時間資料中，單一小時的最高活躍次數</strong><br />
            例如該頻道在某週的最多活躍次數是 10 次（例如週五晚上 21:00）。
          </li>
          <li>
            <strong>將每一小時的活躍次數轉換為「熱度分數（0～4分）」：</strong>
            <table className="mt-2 w-full text-sm border border-gray-300 dark:border-zinc-600">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-700">
                  <th className="border px-2 py-1">該小時的活躍次數 ÷ 最高活躍次數</th>
                  <th className="border px-2 py-1">熱度分數</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border px-2 py-1">= 0</td><td className="border px-2 py-1">0 分</td></tr>
                <tr><td className="border px-2 py-1">(0, 0.2]</td><td className="border px-2 py-1">1 分</td></tr>
                <tr><td className="border px-2 py-1">(0.2, 0.4]</td><td className="border px-2 py-1">2 分</td></tr>
                <tr><td className="border px-2 py-1">(0.4, 0.7]</td><td className="border px-2 py-1">3 分</td></tr>
                <tr><td className="border px-2 py-1">&gt; 0.7</td><td className="border px-2 py-1">4 分</td></tr>
              </tbody>
            </table>
          </li>
          <li>
            <strong>將選取時段內（例如週一的早上）對應的小時分數加總</strong><br />
            每個時間區段定義如下：
            <ul className="list-disc list-inside ml-4">
              <li>凌晨：0–5 時</li>
              <li>早上：6–11 時</li>
              <li>下午：12–17 時</li>
              <li>晚上：18–23 時</li>
            </ul>
          </li>
          <li>
            <strong>加總所有符合條件的時段分數</strong>，得到此頻道在當前篩選條件下的「活躍熱度總分」。
          </li>
        </ol>

        <h3 className="text-lg font-semibold mt-4">📊 範例</h3>
        <p>假設你篩選「週一」與「早上」時段，某頻道在這 6 個小時的活躍次數為：</p>
        <table className="mt-2 w-full text-sm border border-gray-300 dark:border-zinc-600">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-700">
              <th className="border px-2 py-1">小時</th>
              <th className="border px-2 py-1">活躍次數</th>
              <th className="border px-2 py-1">熱度分數（以 max=10）</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border px-2 py-1">6</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0 分</td></tr>
            <tr><td className="border px-2 py-1">7</td><td className="border px-2 py-1">1</td><td className="border px-2 py-1">1 分</td></tr>
            <tr><td className="border px-2 py-1">8</td><td className="border px-2 py-1">2</td><td className="border px-2 py-1">1 分</td></tr>
            <tr><td className="border px-2 py-1">9</td><td className="border px-2 py-1">3</td><td className="border px-2 py-1">2 分</td></tr>
            <tr><td className="border px-2 py-1">10</td><td className="border px-2 py-1">5</td><td className="border px-2 py-1">3 分</td></tr>
            <tr><td className="border px-2 py-1">11</td><td className="border px-2 py-1">10</td><td className="border px-2 py-1">4 分</td></tr>
          </tbody>
        </table>
        <p>總熱度分數：<strong>0+1+1+2+3+4 = 11 分</strong></p>

        <h3 className="text-lg font-semibold mt-4">✅ 解讀方式</h3>
        <p>
          分數愈高，表示該頻道在你選取的時段中出現愈頻繁。
          這個分數用來排序，幫助你找出<strong>哪些頻道習慣在這些時間上活動</strong>。
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
