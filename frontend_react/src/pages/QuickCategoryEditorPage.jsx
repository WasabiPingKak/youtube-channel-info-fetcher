import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassifiedVideos } from '@/hooks/useClassifiedVideos';
import { useFrequentKeywordSuggestions } from '@/hooks/useFrequentKeywordSuggestions';
import { buildSuggestedKeywordCards } from '@/utils/keywordCardBuilder';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';
import KeywordCardList from '@/components/QuickCategoryEditor/KeywordCardList';
import MainLayout from '../components/layout/MainLayout';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useMyChannelId } from '@/hooks/useMyChannelId';
import { toast } from 'react-hot-toast';

const QuickCategoryEditorPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();

  // 權限驗證（登入與 channelId 檢查）
  const { data: me, isLoading: meLoading } = useMyChannelId();

  // hooks 不能包在 if 裡，需先呼叫
  const { videos, loading: loadingVideos } = useClassifiedVideos(channelId);
  const { suggestions } = useFrequentKeywordSuggestions(videos);
  const cards = useQuickCategoryEditorStore((s) => s.cards);
  const hasInitializedRef = useRef(false);

  const [skipKeywords, setSkipKeywords] = useState([]);
  const [configMap, setConfigMap] = useState(new Map());
  const [loadingSkips, setLoadingSkips] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // 權限檢查 (未登入/非本人一律導回首頁)
  useEffect(() => {
    if (!meLoading && me?.channelId === null) {
      toast.error("請先登入以使用快速分類功能");
      navigate("/");
    }
  }, [meLoading, me, navigate]);

  useEffect(() => {
    const myId = me?.channelId;
    if (!meLoading && myId && channelId && myId !== channelId) {
      toast.error("您沒有權限查看此頻道的分類資料");
      navigate("/");
    }
  }, [meLoading, me, channelId, navigate]);

  // Firestore 略過關鍵字
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
          setSkipKeywords(skips);
        }
      } catch (err) {
        console.error('🔥 無法載入 skip_keywords:', err);
      } finally {
        setLoadingSkips(false);
      }
    };
    loadSkipKeywords();
  }, [channelId]);

  // Firestore 分類 config
  useEffect(() => {
    const loadConfig = async () => {
      if (!channelId) return;
      try {
        const db = getFirestore();
        const docRef = doc(db, 'channel_data', channelId, 'settings', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // 一個 keyword 對應多個主分類
          const map = new Map();
          for (const mainCategory in data) {
            const subcategories = data[mainCategory] || {};
            for (const subcategoryName in subcategories) {
              const keywords = subcategories[subcategoryName] || [];
              if (keywords.length === 0) {
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

  // 初始化卡片（合併 keyword + skip + config）
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
      const initialCards = buildSuggestedKeywordCards(
        mergedKeywords,
        videos,
        skipKeywords,
        configMap
      );
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
    channelId,
  ]);

  // hooks 一律呼叫，UI 才 return
  if (me?.channelId === null) return null;
  if (meLoading || !channelId) {
    return (
      <MainLayout>
        <div className="p-6 max-w-xl mx-auto text-center text-gray-500">
          讀取中...
        </div>
      </MainLayout>
    );
  }

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
              已經透過系統預設分類完畢的影片不會顯示在這裡，方便你集中處理還沒分類的部分。<br />
              <span className="ml-4 block">• 一個關鍵字可以被分類到不同主題中，比如「歌雜」可以同時屬於雜談與音樂</span>
              <span className="ml-4 block">• 你可以編輯名稱讓圖表顯示你自訂的標籤。
                <span className="ml-8 block text-gray-600">
                  - 例如，將「ft」編輯為「連動」，那麼圖表中經由「ft」篩選出來的影片就會以「連動」的標籤呈現。
                </span>
              </span>
              <span className="ml-4 block">• 如果你填的是遊戲的正式名稱，推薦直接從左側填表加入全系統分類，讓其他人也能共用這個遊戲名稱的設定。</span>
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
