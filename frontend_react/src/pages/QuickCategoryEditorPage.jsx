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
  const { suggestions } = useFrequentKeywordSuggestions(videos);
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
          // 修正：一個 keyword 對應多個主分類
          const map = new Map();

          for (const mainCategory in data) {
            const subcategories = data[mainCategory] || {};
            for (const subcategoryName in subcategories) {
              const keywords = subcategories[subcategoryName] || [];

              if (keywords.length === 0) {
                // 子分類名稱本身就是 keyword
                if (!map.has(subcategoryName)) map.set(subcategoryName, []);
                map.get(subcategoryName).push({ mainCategory, subcategoryName });
              } else {
                for (const keyword of keywords) {
                  if (!map.has(keyword)) map.set(keyword, []);
                  map.get(keyword).push({ mainCategory, subcategoryName });
                }
              }
            }
          }
          setConfigMap(map);
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
      !loadingSkips &&
      !loadingConfig &&
      !hasInitializedRef.current &&
      videos.length > 0
    ) {
      const suggestionKeywords = suggestions.map((s) => s.keyword);
      const configKeywords = Array.from(configMap.keys());
      const keywordSet = new Set([
        ...suggestionKeywords,
        ...configKeywords,
        ...skipKeywords,
      ]);

      const mergedKeywords = Array.from(keywordSet).map((keyword) => ({
        keyword,
        count: suggestions.find((s) => s.keyword === keyword)?.count || 0,
      }));

      console.group('[🧠 卡片初始化 DEBUG]');
      console.log('💢 suggestions:', suggestions);
      console.log('🎯 suggestionKeywords:', suggestionKeywords);
      console.log('📦 configMap keys:', configKeywords);
      console.log('🚫 skipKeywords:', skipKeywords);
      console.log('🧩 合併後 keywords:', mergedKeywords.map(k => k.keyword));
      console.groupEnd();

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
        isSuccess: c.isSuccess,
        isSaving: c.isSaving,
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
    loadingSkips,
    loadingConfig,
  ]);

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {loadingVideos || loadingSkips || loadingConfig ? (
          <div className="text-center">🚧 分析中，請稍候...</div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">快速分類</h1>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              系統會從所有影片標題中自動擷取重複出現的關鍵字，只要出現次數達兩次以上就會列出，並顯示命中的影片清單。<br />
              一個關鍵字可以被分類到不同主題中，比如「歌雜」可以同時屬於雜談與音樂<br />
              已經透過系統預設分類完畢的影片不會顯示在這裡，方便你集中處理還沒分類的部分。<br />
              若還需要手動微調分類影片清單，請改用
              <a
                href="/my-category-editor"
                className="text-blue-600 hover:underline ml-1"
              >
                完整版編輯器
              </a>
              。
            </p>
            <KeywordCardList cards={cards} />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default QuickCategoryEditorPage;
