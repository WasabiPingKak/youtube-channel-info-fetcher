import React from "react";
import MainLayout from "../components/layout/MainLayout";

const changelog = [
  {
    date: "2025-06-23",
    items: [
      "新增降落轉機塔臺，網站預設首頁改為指向降落塔臺",
    ],
  },
  {
    date: "2025-06-20",
    items: [
      "新增全頻道列表活躍時間篩選功能",
      "新增全頻道列表依國旗分組功能",
      "改善連結 UX，現在所有連結皆可用滑鼠中鍵(Ctrl+左鍵)開啟新分頁",
      "新加入的頻道區域現在可收合"
    ],
  },
  {
    date: "2025-06-17",
    items: [
      "修改首頁頻道遊戲趨勢 UI 顯示",
    ],
  },
  {
    date: "2025-06-13",
    items: [
      "新增頻道活躍時段熱力圖",
    ],
  },
  {
    date: "2025-06-12",
    items: [
      "預設頻道清單以最近更新時間排序",
      "使用正式網域：vtubertrailmap.com",
    ],
  },
  {
    date: "2025-06-07",
    items: [
      "新增自訂影片分類工具",
    ],
  },
  {
    date: "2025-05-31",
    items: [
      "優化頻道頁面載入邏輯 UX",
      "頻道頁面新增熱力圖",
      "新增主題過濾分類總表",
    ],
  },
  {
    date: "2025-05-29",
    items: [
      "實裝登入功能",
      "可以切換頻道的可見性，新註冊使用者預設為不公開",
      "可以設定頻道小卡的國旗顯示，最多十個",
      "遊戲趨勢增加區間顯示 7/14/30 天",
    ],
  },
  {
    date: "2025-05-26",
    items: [
      "新增更新紀錄頁面 /changelog",
      "新增頻道區塊\"新加入的頻道\"",
    ],
  },
  {
    date: "2025-05-24",
    items: [
      "支援 Google OAuth 2.0 直接連結 Youtube 頻道",
    ],
  },
];

const ChangelogPage = () => {
  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-4">🛠️ 更新紀錄</h1>
      <div className="space-y-6">
        {changelog.map((log) => (
          <div key={log.date}>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {log.date}
            </h2>
            <ul className="list-disc list-inside mt-2 text-gray-700 dark:text-gray-300">
              {log.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default ChangelogPage;
