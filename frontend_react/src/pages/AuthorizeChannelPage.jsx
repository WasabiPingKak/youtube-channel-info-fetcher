// src/pages/AuthorizeChannelPage.jsx

import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

const AuthorizeChannelPage = () => {
  const [confirmed, setConfirmed] = useState(false);

  const handleAuthorize = () => {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${REDIRECT_URI}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = authUrl;
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto mt-10 px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">連結頻道</h1>

        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 text-sm leading-relaxed p-4 rounded mb-6 space-y-3">
          <p className="font-semibold text-base">為什麼需要連結？</p>
          <p>
            本站使用 Google 官方授權機制（OAuth 2.0），只是為了確認<b>你是這個頻道的擁有者</b>，我們才能將分析資料<b>只提供給你本人</b>。
          </p>
          <p>你不用擔心連結後資料會立刻被公開，因為：</p>

          <p className="font-semibold text-base">🔒 授權後，我們會做這些事：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>✅ 分析你頻道中<strong className="font-bold">公開的</strong>影片標題與發佈時間，幫你整理出主題方向與內容分布</li>
            <li>✅ 分析結果<strong className="font-bold">預設為私人</strong>，只有你本人登入後才能查看</li>
            <li>✅ 私人狀態的頻道資料不會顯示在頻道清單、排行榜或統計頁；而且即使知道網址，其他人也無法存取</li>
            <li>✅ 所有資料皆儲存在安全伺服器，絕不會在你明確同意前對外展示</li>
          </ul>

          <p className="font-semibold text-base">🚫 我們不會做的事（放心，我們做不到）：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>❌ 不會在連結後立刻公開你的頁面，除非<strong className="font-bold">你親自進入設定中啟用展示功能</strong></li>
            <li>❌ 不會抓取你的非公開、私人、或會員限定影片</li>
            <li>❌ 不會幫你發文、刪影片、改標題或發推播</li>
            <li>❌ 不會發送任何訊息、也不會編輯你的頻道資訊</li>
          </ul>
        </div>

        <div className="space-y-4 text-gray-800 dark:text-gray-300 text-base">
          <p>
            點擊下方按鈕後，我會引導你使用 Google 帳號授權。你授權的內容與用途如下：
          </p>

          <p className="font-semibold text-black dark:text-white">授權流程說明：</p>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-1">
            <li>若你是第一次授權，系統將建立一份你的頻道分析資料。</li>
            <li>若你已授權過，按下按鈕會再次登入，並確認你仍授權本網站使用。</li>
            <li>
              登入後會跳轉至你的頻道設定，
              <span className="text-red-600 dark:text-red-400 font-bold">預設瀏覽權限為私人</span>
              ，直到你在設定中明確啟用。
            </li>
          </ul>
          <div>
            <p className="font-semibold text-black dark:text-white">
              資料用途：
            </p>
            <p className="pl-4">
              授權資料僅用於本網站的靜態分類分析，不會另作他用。若你希望移除這些資料，請聯絡本站開發者協助刪除。
            </p>
          </div>
        </div>

        {/* 紅色警語區塊 */}
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 p-4 rounded space-y-2 text-red-700 dark:text-red-200 text-sm mt-6">
          <p>
            若你所屬的頻道為企業經營、經紀公司或團體所有，請務必事先取得負責人或經紀單位的明確同意再進行授權。
          </p>
          <p>
            本網站僅提供技術分析服務，無法辨別授權人的身分或授權是否經適當同意。
          </p>
          <p>
            若未經允許即授權使用，可能涉及違反內部規範，請創作者自行確認責任歸屬。
          </p>
        </div>

        <div className="mt-6 flex items-start gap-2">
          <input
            id="confirm"
            type="checkbox"
            checked={confirmed}
            onChange={() => setConfirmed(!confirmed)}
            className="mt-1"
          />
          <label htmlFor="confirm" className="text-sm text-gray-700 dark:text-gray-300">
            我已閱讀並同意{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
            >
              隱私權政策
            </a>
            ，我了解本站僅會讀取公開資料並進行分析
          </label>
        </div>

        <div className="mt-6">
          <button
            onClick={handleAuthorize}
            disabled={!confirmed}
            className={`font-semibold py-2 px-4 rounded shadow transition ${confirmed
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
          >
            使用 Google 帳號登入並連結我的 Youtube 頻道
          </button>
        </div>
        {/* <div className="mt-6">
          <button
            disabled
            className="font-semibold py-2 px-4 rounded shadow transition bg-gray-300 text-gray-500 cursor-not-allowed"
          >
            目前系統瀕臨滿載，暫時關閉連結功能
          </button>
      </div>*/}

        {/* 其他授權方式說明 */}
        <div className="mt-8 text-sm text-gray-700 dark:text-gray-300 space-y-3 border-t dark:border-gray-600 pt-6">
          <p className="font-semibold text-black dark:text-white">其他授權方式</p>
          <p>
            如果你不信任自動化的 Google OAuth 2.0 授權流程，亦可選擇以其他方式加入本站分析服務。你可以透過能證明本人身分的私人帳號（如 Twitter、電子信箱等）主動聯繫本站管理者，表示你願意提供頻道資料。
            本站僅會向你索取頻道網址，不會要求提供其他額外資訊。
          </p>
          <p>
            本站並未採用開放表單收集頻道資訊，是因為表單無法保證填寫者即為頻道所有者，而透過上述方式可明確且具書面證據地取得授權同意，較能保障雙方權益。
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default AuthorizeChannelPage;
