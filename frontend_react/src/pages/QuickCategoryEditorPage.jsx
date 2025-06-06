import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClassifiedVideos } from '@/hooks/useClassifiedVideos';
import { useFrequentKeywordSuggestions } from '@/hooks/useFrequentKeywordSuggestions';
import { buildSuggestedKeywordCards } from '@/utils/keywordCardBuilder';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';
import KeywordCardList from '@/components/QuickCategoryEditor/KeywordCardList';
import MainLayout from '../components/layout/MainLayout';

import { getFirestore, doc, getDoc } from 'firebase/firestore';

const QuickCategoryEditorPage = () => {
  const { channelId } = useParams();
  const { videos, loading: loadingVideos } = useClassifiedVideos(channelId);
  const { suggestions, loading: loadingKeywords } = useFrequentKeywordSuggestions(videos);
  const cards = useQuickCategoryEditorStore((s) => s.cards);
  const hasInitializedRef = useRef(false);

  const [skipKeywords, setSkipKeywords] = useState([]);
  const [configMap, setConfigMap] = useState(new Map());
  const [loadingSkips, setLoadingSkips] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);

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

  // ✅ 載入分類 config
  useEffect(() => {
    const loadConfig = async () => {
      if (!channelId) return;
      try {
        const db = getFirestore();
        const docRef = doc(db, 'channel_data', channelId, 'settings', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const map = new Map();

          for (const mainCategory in data) {
            const subcategories = data[mainCategory] || {};
            for (const subcategoryName in subcategories) {
              const keywords = subcategories[subcategoryName] || [];

              if (keywords.length === 0) {
                map.set(subcategoryName, { mainCategory, subcategoryName });
              } else {
                for (const keyword of keywords) {
                  map.set(keyword, { mainCategory, subcategoryName });
                }
              }
            }
          }

          console.log('✅ [Firestore] 取得 config 設定:', map);
          setConfigMap(map);
        } else {
          console.log('ℹ️ [Firestore] 無 config 設定文件');
        }
      } catch (err) {
        console.error('🔥 無法載入 config 設定:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, [channelId]);

  // ✅ 初始化卡片（合併 keyword + skip + config）
  useEffect(() => {
    if (
      !loadingVideos &&
      !loadingKeywords &&
      !loadingSkips &&
      !loadingConfig &&
      !hasInitializedRef.current &&
      videos.length > 0
    ) {
      const keywordSet = new Set([
        ...suggestions.map((s) => s.keyword),
        ...Array.from(configMap.keys()),
        ...skipKeywords,
      ]);

      const mergedKeywords = Array.from(keywordSet).map((keyword) => ({
        keyword,
        count: suggestions.find((s) => s.keyword === keyword)?.count || 0,
      }));

      const initialCards = buildSuggestedKeywordCards(
        mergedKeywords,
        videos,
        skipKeywords,
        configMap
      );

      console.log('[🔧 DEBUG] 初始化卡片數量:', initialCards.length);
      console.log('[🧼 最終卡片]', initialCards.map(c => ({
        keyword: c.keyword,
        agreed: c.agreed,
        skipped: c.skipped,
        count: c.matchedVideos.length,
      })));

      useQuickCategoryEditorStore.getState().setChannelId(channelId);
      useQuickCategoryEditorStore.getState().initializeCards(initialCards);
      hasInitializedRef.current = true;
    }
  }, [
    videos,
    suggestions,
    skipKeywords,
    configMap,
    loadingVideos,
    loadingKeywords,
    loadingSkips,
    loadingConfig,
  ]);

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {loadingVideos || loadingKeywords || loadingSkips || loadingConfig ? (
          <div className="text-center">🚧 分析中，請稍候...</div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">快速分類</h1>
            <KeywordCardList cards={cards} />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default QuickCategoryEditorPage;
