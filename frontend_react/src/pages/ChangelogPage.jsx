import React from "react";
import MainLayout from "../components/layout/MainLayout";

const changelog = [
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
