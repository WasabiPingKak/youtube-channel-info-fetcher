import React from "react";
import MainLayout from "@/components/layout/MainLayout";

export default function DonatePage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800 dark:text-gray-200">
        <h1 className="text-2xl font-bold mb-4">💝 贊助 VTMap</h1>

        <p className="mb-4">
          我懶得自己整合金流服務，所以我們直接使用
          <strong className="text-green-600 dark:text-green-300">綠界科技（ECPay）</strong> 提供的付款連結。
        </p>

        <p className="mb-4">
          如果你願意支持這個專案，只要從下方按鈕前往贊助即可！
        </p>

        <p className="mb-6">
          🔍 <strong>注意：</strong>只要你在贊助時的留言中加入「VTMap」這個關鍵字，
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
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          {/* TODO: 這裡未來從 Firestore 載入資料 */}
          <p>（這裡會顯示所有留言中有提到「VTMap」的贊助者，包含名字、金額與留言內容，用括號包起來是因為我還沒做完）</p>
        </div>
      </div>
    </MainLayout>
  );
}
