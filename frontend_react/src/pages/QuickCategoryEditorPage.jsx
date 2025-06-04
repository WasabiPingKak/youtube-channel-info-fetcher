import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useClassifiedVideos } from '@/hooks/useClassifiedVideos';
import { useFrequentKeywordSuggestions } from '@/hooks/useFrequentKeywordSuggestions';
import { buildSuggestedKeywordCards } from '@/utils/keywordCardBuilder';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';
import KeywordCardList from '@/components/QuickCategoryEditor/KeywordCardList';

import MainLayout from "../components/layout/MainLayout";

const QuickCategoryEditorPage = () => {
  const { channelId } = useParams();
  const { videos, loading: loadingVideos } = useClassifiedVideos(channelId);
  const {
    suggestions,
    loading: loadingKeywords,
  } = useFrequentKeywordSuggestions(videos);
  const cards = useQuickCategoryEditorStore((s) => s.cards);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (
      !loadingVideos &&
      !loadingKeywords &&
      !hasInitializedRef.current &&
      suggestions.length > 0 &&
      videos.length > 0
    ) {
      const initialCards = buildSuggestedKeywordCards(suggestions, videos);
      console.log('[🔧 DEBUG] 初始化卡片數量:', initialCards.length);
      useQuickCategoryEditorStore.getState().initializeCards(initialCards);
      hasInitializedRef.current = true;
    }
  }, [videos, suggestions, loadingVideos, loadingKeywords]);

  if (loadingVideos || loadingKeywords) {
    return <div className="p-6 text-center">🚧 分析中，請稍候...</div>;
  }
  console.log('[🔍 DEBUG] 取得影片數量:', videos.length);
  console.log('[🔍 DEBUG] 分析高頻詞:', suggestions);

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">快速分類</h1>
        <KeywordCardList cards={cards} />
      </div>
    </MainLayout>
  );
};

export default QuickCategoryEditorPage;
