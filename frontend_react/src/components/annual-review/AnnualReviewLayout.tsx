// src/components/annual-review/AnnualReviewLayout.tsx

import React from "react";
import { useAnnualReviewData } from "@/hooks/useAnnualReviewData";
import AnnualStatsSection from "@/components/annual-review/AnnualStatsSection";
import SpecialHighlightsSection from "@/components/annual-review/SpecialHighlightsSection";
import ChannelInfoCard from "@/components/common/ChannelInfoCard";

interface AnnualReviewLayoutProps {
  channelId: string;
  year: number;
}

export default function AnnualReviewLayout({
  channelId,
  year,
}: AnnualReviewLayoutProps) {
  const { stats, special, loading, error } = useAnnualReviewData(channelId, year);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <ChannelInfoCard />

      {/* 頁面標題 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {year} 年度回顧
        </h1>
        <p className="text-muted-foreground">
          回顧頻道在 {year} 年的創作足跡與統計總覽
        </p>
      </div>

      {/* 載入狀態 */}
      {loading && (
        <p className="text-sm text-muted-foreground">載入中...</p>
      )}
      {error && (
        <p className="text-sm text-red-500">
          無法載入影片資料：{error.message}
        </p>
      )}

      {/* 成功載入時呈現統計元件 */}
      {!loading && !error && (
        <>
          {/* 📊 一般統計區塊 */}
          <AnnualStatsSection stats={stats} />

          {/* 🌟 特殊項目區塊 */}
          <SpecialHighlightsSection special={special} />
        </>
      )}
    </div>
  );
}
