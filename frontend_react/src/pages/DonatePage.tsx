// pages/DonatePage.jsx
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import DonationList from "@/components/donations/DonationList";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function DonatePage() {
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/donations`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((d) =>
          d.patronNote?.toLowerCase().includes("vtmap")
        );
        setDonations(filtered);
      })
      .catch((err) => console.error("🚨 Failed to fetch donations:", err));
  }, []);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800 dark:text-gray-200">
        <h1 className="text-2xl font-bold mb-4">💝 贊助 VTMap</h1>

        <p className="mb-6">
          這是一個功德專案，目前沒有商業化的打算。
        </p>

        <p className="mb-6">
          網站的起點是我想試試 Vibe Coding 能耐的一個實驗性專案。一開始做了個工具分析自己頻道的內容分類，後來想想既然自己的頻道都能做，不如就擴充成讓所有 YouTube 頻道都能用的服務吧。<br />
          接著就加入了頻道綁定、自訂影片分類關鍵字、遊戲趨勢統計、以及「降落轉機塔臺」功能，即時整理目前正在開台的頻道，讓觀眾與主播都能快速掌握誰正在開直播。
        </p>

        <p className="mb-4">
          身為一個開發者，很高興自己做的東西有這麼多人願意使用，一開始做的初衷並沒有要以營利為目標。<br />
          但是如果你願意支持這個專案，只要從下方按鈕前往贊助即可！
        </p>

        <p className="mb-4">
          不過還要自己做金流就太難了，所以我們直接使用
          <strong className="text-green-600 dark:text-green-300">綠界科技（ECPay）</strong> 提供的付款連結。
        </p>

        <p className="mb-6">
          💡 <strong>小提醒：</strong>只要你在贊助時的留言中加入「VTMap」這個關鍵字，
          你的<strong>名字、留言與金額</strong>就會顯示在本頁面下方的公開區域中。
        </p>

        <div className="text-center mb-10">
          <a
            href="https://payment.ecpay.com.tw/Broadcaster/Donate/29C04D2522B2011D2EE69C4AAC3AEE6A"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-rose-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-rose-700 transition"
          >
            👉 前往綠界贊助頁面
          </a>
        </div>

        <hr className="my-8 border-gray-300 dark:border-zinc-700" />

        <h2 className="text-xl font-semibold mb-4">💬 贊助者留言</h2>

        {donations.length > 0 ? (
          <DonationList donations={donations} />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            （目前還沒有留言中包含「VTMap」的紀錄）
          </p>
        )}
      </div>
    </MainLayout>
  );
}
