import React from "react";
import MainLayout from "../components/layout/MainLayout";

const changelog = [
  {
    date: "2026-02-19",
    items: [
      "於降落轉機塔臺新增複製直播 ID 與複製直播標題按鈕",
    ],
  },
  {
    date: "2025-12-18",
    items: [
      "於個人頭像頁面，新增年度回顧功能",
    ],
  },
  {
    date: "2025-10-07",
    items: [
      "現在服務會自動抓取更新後的頻道名稱及頭像",
    ],
  },
  {
    date: "2025-07-24",
    items: [
      "在檢視所有頻道頁面中，頻道卡片新增各類主題的長條圖，並可以按照主題的佔比排序",
    ],
  },
  {
    date: "2025-07-03",
    items: [
      "降落轉機塔臺現在可以顯示分類徽章，以及使用分類徽章過濾",
      "在側邊欄新增一個贊助連結，希望大家常常用",
    ],
  },
  {
    date: "2025-07-01",
    items: [
      "將帳號相關功能整合到右上角",
      "將遊戲清單相關功能整合至遊戲分類總表頁面",
    ],
  },
  {
    date: "2025-06-26",
    items: [
      "降落轉機塔臺現在會正確排除不正常關播的直播：待機室過了預定時間未開、直播途中轉私人/不公開、直播被 ban",
    ],
  },
  {
    date: "2025-06-26",
    items: [
      "新增深色模式",
      "降落轉機塔臺會正確排除權限是非公開狀態的直播"
    ],
  },
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
