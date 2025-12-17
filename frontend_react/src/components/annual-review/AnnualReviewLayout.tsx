// src/components/annual-review/AnnualReviewLayout.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnnualReviewData } from "@/hooks/useAnnualReviewData";
import { useMyChannelId } from "@/hooks/useMyChannelId";
import AnnualStatsSection from "@/components/annual-review/AnnualStatsSection";
import SpecialHighlightsSection from "@/components/annual-review/SpecialHighlightsSection";
import ChannelInfoCard from "@/components/common/ChannelInfoCard";

interface AnnualReviewLayoutProps {
  channelId: string;
  year: number;
}

function AnnualReviewContent({
  channelId,
  year,
}: {
  channelId: string;
  year: number;
}) {
  const navigate = useNavigate();
  const { stats, special, loading, error } = useAnnualReviewData(channelId, year);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="mb-4">
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            🔒 此為私人年度回顧頁面，僅限你本人瀏覽，其他人無法查看
          </p>
        </div>
      </div>
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
      {loading && <p className="text-sm text-muted-foreground">載入中...</p>}
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

      {/* ✅ 最下方：未知類別引導到快速分類器 */}
      <div className="pt-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-2">
            <div className="text-sm font-medium">很多「未知類別」怎麼辦？</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              如果有系統分辨不出來的未知類別（例如顯示為「未分類」或類別不明），
              你可以到「快速分類器」先把影片快速分到正確分類，年度回顧的統計也會更準。
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate(`/quick-category-editor/${channelId}`)}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              前往快速分類器
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnualReviewLayout({
  channelId,
  year,
}: AnnualReviewLayoutProps) {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useMyChannelId();

  // 1) 還在確認登入 / 權限中：不要 render 內容（避免閃一下）
  if (meLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">載入中...</p>
      </div>
    );
  }

  // 2) 未登入：擋 UX（你也可以改成導回首頁）
  if (!me || me.channelId === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="text-base font-semibold">需要登入</div>
          <p className="text-sm text-muted-foreground">
            此頁為私人年度回顧，請先登入後再查看。
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3) admin 無條件放行；非 admin 則必須是本人頻道
  const isAllowed = me.isAdmin || me.channelId === channelId;

  if (!isAllowed) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="text-base font-semibold">沒有權限瀏覽</div>
          <p className="text-sm text-muted-foreground">
            此頁為私人年度回顧，僅限頻道持有者瀏覽。
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 通過權限才 mount 真正內容（才會去跑 useAnnualReviewData）
  return <AnnualReviewContent channelId={channelId} year={year} />;
}
