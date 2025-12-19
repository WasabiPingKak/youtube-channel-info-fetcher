// src/components/annual-review/AnnualReviewLayout.tsx

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Share2, ArrowLeft, Download, Loader2, ShieldCheck } from "lucide-react";
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

/**
 * 根據總時數計算年度稱號 (檢視點 1 優化)
 */
const getAnnualTitle = (hours: number) => {
  if (hours >= 1000) return { label: "傳奇級創作者", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" };
  if (hours >= 500) return { label: "年度高產創作者", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" };
  if (hours >= 100) return { label: "熱血創作者", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" };
  return { label: "持續耕耘創作者", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
};

function AnnualReviewContent({
  channelId,
  year,
}: {
  channelId: string;
  year: number;
}) {
  const navigate = useNavigate();

  // 1. 取得數據
  const { stats, special, loading, error } = useAnnualReviewData(channelId, year);
  const { data: channelInfo } = useChannelIndex(channelId);

  // 2. 狀態控制
  const [showShareMode, setShowShareMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // 3. 計算稱號 (Memoized)
  const titleInfo = useMemo(() => getAnnualTitle(stats?.totalLiveHours || 0), [stats?.totalLiveHours]);

  // 4. 下載圖片函式
  const handleDownloadImage = useCallback(async () => {
    const node = document.getElementById("share-card-node");
    if (!node) return;

    try {
      setIsDownloading(true);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#020617'
      });
      const link = document.createElement("a");
      const safeName = channelInfo?.name?.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_') || "channel";
      link.download = `${safeName}-${year}-review.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("圖片生成失敗:", err);
      alert("圖片生成失敗，可能是圖片跨域問題 (CORS) 或瀏覽器限制。");
    } finally {
      setIsDownloading(false);
    }
  }, [channelInfo?.name, year]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* 🚀 檢視點 1 優化：標題與英雄區 (Hero Section) */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 border border-slate-800 p-8 md:p-12 shadow-2xl">
        {/* 背景裝飾光暈 - 增加空間感 */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-80 w-80 bg-emerald-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 bg-blue-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-6">
            {/* 隱私標籤 */}
            {!showShareMode && (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                僅限你本人瀏覽的私人數據
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
                  {year}
                </span>
                {" "}年度回顧
              </h1>

              {/* 年度稱號動態顯示 */}
              {!loading && !error && (
                <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-bold tracking-wider uppercase shadow-sm ${titleInfo.bg} ${titleInfo.color} ${titleInfo.border}`}>
                  🏆 {titleInfo.label}
                </div>
              )}
            </div>

            <p className="text-slate-400 max-w-lg text-sm md:text-base leading-relaxed font-medium">
              {showShareMode
                ? "預覽你的年度成就卡片。這張卡片記錄了你這一年辛勤創作的縮影，點擊下載即可與世界分享。"
                : `回首這一年，你在創作的路上留下了深刻的足跡。讓我們透過數據，重新發現你在 ${year} 年的每一刻精彩。`}
            </p>
          </div>

          {/* 右側按鈕區塊 */}
          {!loading && !error && (
            <div className="flex flex-wrap items-center gap-3">
              {showShareMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                  >
                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    下載圖片
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareMode(false)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 text-sm font-bold text-white border border-slate-700 hover:bg-slate-700 transition-all"
                  >
                    <ArrowLeft size={18} />
                    返回
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowShareMode(true)}
                  className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-base font-black text-slate-950 hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                >
                  <Share2 size={20} className="group-hover:rotate-12 transition-transform" />
                  分享我的年度成就
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 載入與錯誤狀態 (保持原樣，或可視需求美化) */}
      {loading && <p className="text-sm text-muted-foreground animate-pulse">正在整理您的年度回顧資料...</p>}
      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
          無法載入影片資料：{error.message}
        </p>
      )}

      {/* 內容區塊 */}
      {!loading && !error && stats && special && (
        <>
          {showShareMode ? (
            /* 📸 分享模式 */
            <div className="flex flex-col rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950/50 py-12 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
              <div className="mb-8 text-center space-y-2">
                <div className="text-sm font-bold text-emerald-500 uppercase tracking-widest">年度成就卡片</div>
                <div className="text-xs text-slate-500">預覽畫面：下載後的圖片將會以此比例呈現 (3:4)</div>
              </div>

              <div className="w-full overflow-x-auto pb-8">
                <div className="w-fit mx-auto px-8">
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
            /* 📊 一般模式 */
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <ChannelInfoCard />
              <AnnualStatsSection stats={stats} />
              <SpecialHighlightsSection special={special} />

              {/* 快速分類器引導 */}
              <div className="pt-4">
                <div className="rounded-[2rem] border border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/50 p-8 backdrop-blur-sm shadow-sm dark:shadow-none">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        數據不夠準確？
                      </div>
                      <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-medium">
                        如果你的年度回顧中出現較多「未分類」項目，這會直接影響統計結果的精準度。
                        建議前往「快速分類器」標註影片分類，完成後重新整理此頁面即可更新數據。
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/quick-category-editor/${channelId}`)}
                      className="whitespace-nowrap rounded-2xl bg-slate-900 dark:bg-white px-8 py-4 text-sm md:text-base font-black text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none"
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
  const { data: me, isLoading: meLoading } = useMyChannelId();

  if (meLoading) return <div className="max-w-5xl mx-auto px-4 py-12"><p className="text-sm text-muted-foreground animate-pulse">身分驗證中...</p></div>;

  if (!me || me.channelId === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-slate-950 border border-slate-800 p-10 rounded-[2rem] space-y-6">
          <h2 className="text-2xl font-bold text-emerald-500">需要登入</h2>
          <p className="text-slate-400">此頁面包含私人統計數據，請先登入後再查看您的年度回顧。</p>
          <button onClick={() => navigate("/")} className="bg-white text-slate-950 px-8 py-3 rounded-xl font-bold">返回首頁</button>
        </div>
      </div>
    );
  }

  const isAllowed = me.isAdmin || me.channelId === channelId;
  if (!isAllowed) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-slate-950 border border-slate-800 p-10 rounded-[2rem] space-y-6">
          <h2 className="text-2xl font-bold text-red-400">權限不足</h2>
          <p className="text-slate-400">抱歉，您沒有權限瀏覽此頻道的私密年度回顧。</p>
          <button onClick={() => navigate("/")} className="bg-white text-slate-950 px-8 py-3 rounded-xl font-bold">返回首頁</button>
        </div>
      </div>
    );
  }

  return <AnnualReviewContent channelId={channelId} year={year} />;
}