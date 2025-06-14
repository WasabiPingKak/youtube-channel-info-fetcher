// src/pages/AuthorizeChannelPage.jsx

import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

const AuthorizeChannelPage = () => {
  const [confirmed, setConfirmed] = useState(false);

  const handleAuthorize = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
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
        <h1 className="text-2xl font-bold mb-6">綁定頻道分析</h1>

        <div className="space-y-4 text-gray-800 text-base">
          <p>
            本站旨在協助創作者分析自己的 YouTube 頻道內容，主要是影片分類與主題分布。
            分類結果僅根據影片標題進行過濾分析，無法讀取影片實際內容。
          </p>
          <p>
            雖然網站名稱為「Vtuber TrailMap」，但本服務不限 Vtuber 使用，
            任何 YouTube 創作者皆可授權使用。
          </p>
          <p>
            點擊下方按鈕後，我會引導你使用 Google 帳號授權。你授權的內容與用途如下：
          </p>

          <p className="font-semibold text-black">授權流程說明：</p>
          <ul className="list-disc list-inside text-sm text-gray-700 leading-relaxed space-y-1">
            <li>若你是第一次授權，系統將建立一份你的頻道分析資料。</li>
            <li>若你已授權過，按下按鈕會再次登入，並確認你仍授權本網站使用。</li>
            <li>
              登入後會跳轉至你的頻道設定，
              <span className="text-red-600 font-bold">預設瀏覽權限為不公開</span>
              ，直到你在設定中明確啟用。
            </li>
          </ul>

          {/* 授權內容簡要條列 */}
          <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
            <div>
              <p className="font-semibold text-black">
                本站僅會讀取你頻道中原本就公開的資訊：
              </p>
              <p className="pl-4">
                包括頻道名稱、頻道資訊欄、頻道頭像、影片縮圖、影片標題、影片時長、影片資訊欄、播放清單與發佈時間。
              </p>
            </div>

            <div>
              <p className="font-semibold text-black">
                本站不會取得頻道的任何操作權限：
              </p>
              <p className="pl-4">
                無法發佈、修改、刪除任何影片、留言、播放清單或變更其他設定，也無法發送社群貼文。
              </p>
            </div>
            <div>
              <p className="font-semibold text-black">
                本站無法取得非公開的頻道資訊：
              </p>
              <p className="pl-4">
                無法取得會員限定內容、不公開影片、私人影片、不公開的播放清單、私人播放清單。
              </p>
            </div>

            <div>
              <p className="font-semibold text-black">
                資料用途：
              </p>
              <p className="pl-4">
                授權資料僅用於本網站的靜態分類分析，不會另作他用。若你希望移除這些資料，請聯絡本站開發者協助刪除。
              </p>
            </div>
          </div>
        </div>

        {/* 紅色警語區塊 */}
        <div className="bg-red-50 border border-red-200 p-4 rounded space-y-2 text-red-700 text-sm">
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
          <label htmlFor="confirm" className="text-sm text-gray-700">
            我已閱讀並同意{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
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
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            使用 Google 帳號登入並綁定我的 Youtube 頻道
          </button>
        </div>
      </div>
      {/* 其他授權方式說明 */}
      <div className="mt-8 text-sm text-gray-700 space-y-3 border-t pt-6">
        <p className="font-semibold text-black">其他授權方式</p>
        <p>
          如果你不信任自動化的 Google OAuth 2.0 授權流程，亦可選擇以其他方式加入本站分析服務。你可以透過能證明本人身分的私人帳號（如 Twitter、電子信箱等）主動聯繫本站管理者，表示你願意提供頻道資料。
          本站僅會向你索取頻道網址，不會要求提供其他額外資訊。
        </p>
        <p>
          本站並未採用開放表單收集頻道資訊，是因為表單無法保證填寫者即為頻道所有者，而透過上述方式可明確且具書面證據地取得授權同意，較能保障雙方權益。
        </p>
      </div>
    </MainLayout>
  );
};

export default AuthorizeChannelPage;
