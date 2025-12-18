// src/components/annual-review/AnnualReviewLayout.tsx

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Share2, ArrowLeft, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { useAnnualReviewData } from "@/hooks/useAnnualReviewData";
import { useMyChannelId } from "@/hooks/useMyChannelId";
import { useChannelIndex } from "@/hooks/useChannelIndex";
import AnnualStatsSection from "@/components/annual-review/AnnualStatsSection";
import SpecialHighlightsSection from "@/components/annual-review/SpecialHighlightsSection";
import ChannelInfoCard from "@/components/common/ChannelInfoCard";
import AnnualReviewShareCard from "@/components/annual-review/AnnualReviewShareCard";

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

  // 1. 取得年度數據 (統計資料)
  const { stats, special, loading, error } = useAnnualReviewData(channelId, year);

  // 2. 取得公開頻道資訊 (用於分享卡片的名稱與頭像)
  const { data: channelInfo } = useChannelIndex(channelId);

  // 3. 狀態控制
  const [showShareMode, setShowShareMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // 4. 下載圖片函式
  const handleDownloadImage = useCallback(async () => {
    // 抓取 AnnualReviewShareCard 的 DOM 節點
    const node = document.getElementById("share-card-node");
    if (!node) return;

    try {
      setIsDownloading(true);

      // 轉換為 PNG Data URL
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2, // 提升解析度 (Retina 畫質)
        backgroundColor: '#020617' // 設定背景色 (slate-950) 避免圓角產生白邊
      });

      // 建立下載連結
      const link = document.createElement("a");
      const safeName = channelInfo?.name?.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_') || "channel";
      link.download = `${safeName}-${year}-review.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("圖片生成失敗:", err);
      alert("圖片生成失敗，可能是圖片跨域問題 (CORS) 或瀏覽器限制。請嘗試手動截圖。");
    } finally {
      setIsDownloading(false);
    }
  }, [channelInfo?.name, year]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* 頂部功能區：標題與按鈕 */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          {/* 只有在非分享模式才顯示隱私提示 */}
          {!showShareMode && (
            <div className="mb-4 inline-block rounded-md border border-border bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                🔒 此為私人年度回顧頁面，僅限你本人瀏覽
              </p>
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {year} 年度回顧
          </h1>
          <p className="text-muted-foreground">
            {showShareMode
              ? "預覽並下載你的年度回顧卡片 (比例 3:4)"
              : `回顧頻道在 ${year} 年的創作足跡與統計總覽`}
          </p>
        </div>

        {/* 右側按鈕群組 (資料載入後顯示) */}
        {!loading && !error && (
          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* 下載按鈕 (只在分享模式顯示) */}
            {showShareMode && (
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    下載圖片
                  </>
                )}
              </button>
            )}

            {/* 切換模式按鈕 */}
            <button
              type="button"
              onClick={() => setShowShareMode(!showShareMode)}
              className={`
                inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all shadow-sm
                ${showShareMode
                  ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"}
              `}
            >
              {showShareMode ? (
                <>
                  <ArrowLeft size={16} />
                  返回
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  分享
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 載入與錯誤狀態 */}
      {loading && <p className="text-sm text-muted-foreground">載入中...</p>}
      {error && (
        <p className="text-sm text-red-500">
          無法載入影片資料：{error.message}
        </p>
      )}

      {/* 內容區塊 */}
      {!loading && !error && stats && special && (
        <>
          {showShareMode ? (
            /* 📸 分享模式：橫向捲動預覽區 */
            <div className="flex flex-col rounded-xl border-2 border-dashed border-border/60 bg-muted/20 py-8 md:py-12 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
              <div className="mb-6 text-sm text-muted-foreground text-center px-4">
                💡 預覽畫面：點擊右上角「下載圖片」即可儲存
              </div>

              {/* ↔️ 橫向捲動容器 */}
              <div className="w-full overflow-x-auto pb-4">
                {/* 置中容器 (電腦版置中，手機版保留 padding 並允許被撐開) */}
                <div className="w-fit mx-auto px-4">
                  <AnnualReviewShareCard
                    year={year}
                    channelName={channelInfo?.name || "My Channel"}
                    channelAvatar={channelInfo?.thumbnail || undefined}
                    stats={stats}
                    special={special}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* 📊 一般模式：顯示網頁版詳細數據 */
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
              <ChannelInfoCard />

              <AnnualStatsSection stats={stats} />

              <SpecialHighlightsSection special={special} />

              {/* 未知類別引導 CTA */}
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
          )}
        </>
      )}
    </div>
  );
}

export default function AnnualReviewLayout({
  channelId,
  year,
}: AnnualReviewLayoutProps) {
  const navigate = useNavigate();
  // 權限驗證：使用 useMyChannelId 確認是否為本人
  const { data: me, isLoading: meLoading } = useMyChannelId();

  // 1) 載入中
  if (meLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">載入中...</p>
      </div>
    );
  }

  // 2) 未登入
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

  // 3) 權限檢查：admin 或本人
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

  // ✅ 通過權限才 mount 真正內容
  return <AnnualReviewContent channelId={channelId} year={year} />;
}