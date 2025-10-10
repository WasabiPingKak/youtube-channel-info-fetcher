// src/components/annual-review/AnnualReviewLayout.tsx

import React from "react";
import { useAnnualReviewData } from "@/hooks/useAnnualReviewData";

interface AnnualReviewLayoutProps {
  channelId: string;
  year: number;
}

export default function AnnualReviewLayout({
  channelId,
  year,
}: AnnualReviewLayoutProps) {
  const { videos, loading, error } = useAnnualReviewData(channelId, year);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
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
      {loading && <p className="text-sm text-muted-foreground">載入中...</p>}
      {error && (
        <p className="text-sm text-red-500">
          無法載入影片資料：{error.message}
        </p>
      )}

      {/* 畫面主體（尚未實作區塊） */}
      {!loading && !error && (
        <>
          <section>
            <h2 className="text-xl font-semibold mb-4">📊 一般統計</h2>
            <div className="text-muted-foreground text-sm">
              （待整合 AnnualStatsSection 元件）
              <br />
              當前影片總數：{videos.length}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">🌟 特殊項目</h2>
            <div className="text-muted-foreground text-sm">
              （待整合 SpecialHighlightsSection 元件）
            </div>
          </section>
        </>
      )}
    </div>
  );
}
