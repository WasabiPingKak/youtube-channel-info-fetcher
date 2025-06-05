import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClassifiedVideos } from '@/hooks/useClassifiedVideos';
import { useFrequentKeywordSuggestions } from '@/hooks/useFrequentKeywordSuggestions';
import { buildSuggestedKeywordCards } from '@/utils/keywordCardBuilder';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';
import KeywordCardList from '@/components/QuickCategoryEditor/KeywordCardList';
import MainLayout from "../components/layout/MainLayout";

import { getFirestore, doc, getDoc } from 'firebase/firestore';

const QuickCategoryEditorPage = () => {
  const { channelId } = useParams();
  const { videos, loading: loadingVideos } = useClassifiedVideos(channelId);
  const { suggestions, loading: loadingKeywords } = useFrequentKeywordSuggestions(videos);
  const cards = useQuickCategoryEditorStore((s) => s.cards);
  const hasInitializedRef = useRef(false);

  const [skipKeywords, setSkipKeywords] = useState([]);
  const [loadingSkips, setLoadingSkips] = useState(true);

  // ✅ 載入略過關鍵字
  useEffect(() => {
    const loadSkipKeywords = async () => {
      if (!channelId) return;
      try {
        const db = getFirestore();
        const docRef = doc(db, 'channel_data', channelId, 'settings', 'skip_keywords');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const skips = data.skipped || [];
          console.log('✅ [Firestore] 取得略過關鍵字:', skips);
          setSkipKeywords(skips);
        } else {
          console.log('ℹ️ [Firestore] 無略過關鍵字設定文件');
        }
      } catch (err) {
        console.error('🔥 無法載入 skip_keywords:', err);
      } finally {
        setLoadingSkips(false);
      }
    };
    loadSkipKeywords();
  }, [channelId]);

  // ✅ 初始化卡片（含 skip 標記）
  useEffect(() => {
    if (
      !loadingVideos &&
      !loadingKeywords &&
      !loadingSkips &&
      !hasInitializedRef.current &&
      suggestions.length > 0 &&
      videos.length > 0
    ) {
      const initialCards = buildSuggestedKeywordCards(suggestions, videos, skipKeywords);
      console.log('[🔧 DEBUG] 初始化卡片數量:', initialCards.length);
      useQuickCategoryEditorStore.getState().initializeCards(initialCards);
      hasInitializedRef.current = true;
    }
  }, [videos, suggestions, skipKeywords, loadingVideos, loadingKeywords, loadingSkips]);

  if (loadingVideos || loadingKeywords || loadingSkips) {
    return <div className="p-6 text-center">🚧 分析中，請稍候...</div>;
  }

  console.log('[🔍 DEBUG] 取得影片數量:', videos.length);
  console.log('[🔍 DEBUG] 分析高頻詞:', suggestions);
  console.log('[🔍 DEBUG] 略過清單:', skipKeywords);

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
