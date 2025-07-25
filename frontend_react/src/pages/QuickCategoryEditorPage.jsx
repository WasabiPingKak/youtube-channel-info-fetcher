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
import { showSuccessToast, showFailureToast, showLoginRequiredToast, showPermissionDeniedToast } from "@/components/common/ToastManager";

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
      showLoginRequiredToast("請先登入以使用快速分類功能");
      navigate("/");
    }
  }, [meLoading, me, navigate]);

  useEffect(() => {
    const myId = me?.channelId;
    if (!meLoading && myId && channelId && myId !== channelId) {
      showPermissionDeniedToast("您沒有權限查看此頻道的分類資料");
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
        <div className="p-6 max-w-xl mx-auto text-center text-gray-500 dark:text-gray-300">
          讀取中...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {loadingVideos || loadingSkips || loadingConfig ? (
          <div className="text-center text-gray-700 dark:text-gray-200">
            🚧 分析中，請稍候...
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              快速分類
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              這裡是系統判斷不出來的影片清單，我們幫你挑出了在影片標題中重複出現的關鍵字（至少出現兩次），並列出命中的影片。<br />
              <span className="ml-4 block">• 關鍵字可屬於多個主題，例如「歌雜」可同時是雜談與音樂</span>
              <span className="ml-4 block">
                •「✏️ 編輯顯示名稱」可以把你的標題關鍵字轉換成你想顯示的徽章標題
                <span className="block ml-8">
                  - 例如你的標題是「鼠繪台」，可以透過編輯將徽章的文字顯示成「繪圖台」，但依然是用「鼠繪台」做標題過濾。
                </span>
                <span className="block ml-8">
                  - 又例如你的遊戲標題是故意諧音的「星窮鐵道」，可以透過編輯將徽章的文字顯示成「星穹鐵道」。
                </span>
              </span>
              <span className="ml-4 block mb-4">• 若是正式的遊戲名稱，建議透過左側填表加入系統分類，方便全站共用</span>

              若需手動微調分類結果，請改用
              <a
                href="/my-category-editor"
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                進階版編輯器
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
