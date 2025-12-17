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
import {
  showSuccessToast,
  showFailureToast,
  showLoginRequiredToast,
  showPermissionDeniedToast,
} from "@/components/common/ToastManager";

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
    const myId = me?.channelId;
    const isAdmin = Boolean(me?.isAdmin);

    if (!meLoading && myId && channelId && !isAdmin && myId !== channelId) {
      showPermissionDeniedToast("您沒有權限查看此頻道的分類資料");
      navigate("/");
    }
  }, [meLoading, me, channelId, navigate]);

  useEffect(() => {
    const myId = me?.channelId;
    const isAdmin = Boolean(me?.isAdmin);

    // 尚在載入中，不做任何判斷
    if (meLoading) return;

    // 未登入
    if (!myId) {
      showLoginRequiredToast("請先登入以使用快速分類功能");
      navigate("/");
      return;
    }

    // admin 無條件放行
    if (isAdmin) return;

    // 非 admin，且不是本人頻道 → 擋
    if (channelId && myId !== channelId) {
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
              這一頁整理的是系統目前無法自動分類的影片，
              我們從你的影片標題中找出「反覆出現的用語」，並整理成卡片，協助你快速補齊屬於自己頻道的分類。<br />
              <br />

              你可以在這裡決定：<br />
              哪些用語值得成為一個分類、要歸到哪個主題，<br />
              或是略過不需要處理的項目。<br />
              <br />

              💡 小提醒：<br />
              <span className="ml-4 block">
                • 同一個用語可以同時屬於多個主題（例如「歌雜」可以多選「雜談」+「音樂」）
              </span>
              <span className="ml-4 block">
                • 分類顯示的名稱可以自行調整，不一定要和標題裡的用語完全相同
                <span className="block ml-8">
                  - 例如標題常用「星窮鐵道」，你可以把分類顯示成「星穹鐵道」
                </span>
                <span className="block ml-8">
                  - 這只會影響你這個頻道的顯示，不會影響全站或其他人的分類
                </span>
                <span className="block ml-8">
                  - 如果你希望保留原本的用法，也可以什麼都不改直接儲存
                </span>
              </span>
              <br />

              如果你有特殊需求要逐字微調分類結構，<br />
              建議使用
              <a
                href="/my-category-editor"
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                進階版分類編輯器
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
