import React from "react";
import MainLayout from "../components/layout/MainLayout";
import { useMultipleChannelInfo } from "../hooks/useMultipleChannelInfo";
import GameAliasContributorsSection from "../components/contributors/GameAliasContributorsSection";

const TEST_CHANNEL_IDS = [
  "UC-efxH6WiBaVxsHq5RGcZkA",
  "UC47Qt3qqbcxNxiD8CDHEXZA",
  "UC4pKR8eYYweeqeb5ldON6oQ",
  "UCAWxyM326xkFLVQUQM2ekOA",
  "UCJyUJuz8L-mu1Ted8W-QR_Q",
  "UCMtQbSEnJcyVRFIL8xvrbmg",
  "UCWsO4oPIsO8uwxqy_Uq5jzA",
  "UC_KEI-aB1kt0qHnVC2xuX8g",
  "UCbDWjj0pzq2sZY51fJhxqVg",
  "UCeJLIKGW9MtNJhR2LLOEvpQ",
  "UCk4ZazRDVOZfr6QYkE62kZw",
  "UCroAcEtu4HwSIeKpULQwblw",
  "UCyXZskLYSvH_6VkQilWVpUQ",
  "UCz07NnURsnxosjfM3mKYTGQ"
];

const ThanksPage = () => {
  const { data, isLoading, error } = useMultipleChannelInfo(TEST_CHANNEL_IDS);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">💖 感謝者名單</h1>

        {/* 頻道測試區塊 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-pink-700">🎥 提供頻道測試</h2>
          {isLoading && <p className="text-gray-500">載入中...</p>}
          {error && <p className="text-red-600">錯誤：{error.message}</p>}
          <p className="text-sm text-gray-500 mb-4">頻道依名稱字典順序排列。</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data).sort(([, a], [, b]) => a.name.localeCompare(b.name))
              .map(([channelId, info]) => (
                <div key={channelId} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded shadow">
                  <img src={info.thumbnail} alt={info.name} className="w-12 h-12 rounded-full object-cover" />
                  <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {info.name}
                  </a>
                </div>
              ))}
          </div>
        </section>

        {/* 協助更新遊戲名稱區塊（使用共用元件，預設展開） */}
        <GameAliasContributorsSection defaultOpen={true} />
      </div>
    </MainLayout>
  );
};

export default ThanksPage;
