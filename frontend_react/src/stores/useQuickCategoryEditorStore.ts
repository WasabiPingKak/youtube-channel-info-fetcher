import { create } from 'zustand';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';

interface QuickCategoryEditorStore {
  cards: SuggestedKeywordCardState[];

  initializeCards: (cards: SuggestedKeywordCardState[]) => void;

  toggleAgree: (keyword: string) => void;
  toggleSkip: (keyword: string) => void;

  setKeywordSkipped: (keyword: string, skipped: boolean) => Promise<void>;

  setSubcategoryName: (keyword: string, newName: string) => void;
  toggleMainCategory: (keyword: string, category: string) => void;

  getAgreedCount: () => number;
  getSavePayload: () => Record<string, Record<string, string[]>>;
}

const ACTIVE_CHANNEL_ID = 'UCLxa0YOtqi8IR5r2dSLXPng';

export const useQuickCategoryEditorStore = create<QuickCategoryEditorStore>((set, get) => ({
  cards: [],

  initializeCards: (newCards) => {
    console.log('[📥 Zustand] 初始化 cards：', newCards.length, '筆');
    set({ cards: newCards });
  },

  toggleAgree: (keyword) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.keyword === keyword ? { ...c, agreed: !c.agreed, skipped: false } : c
      ),
    })),

  toggleSkip: (keyword) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.keyword === keyword ? { ...c, skipped: !c.skipped, agreed: false } : c
      ),
    })),

  // ✅ 新增：與後端整合的略過狀態切換
  setKeywordSkipped: async (keyword, skipped) => {
    const prevCards = get().cards;
    const newCards = prevCards.map((c) =>
      c.keyword === keyword ? { ...c, skipped, agreed: false } : c
    );
    set({ cards: newCards });

    // ✅ Debug log：準備送出 API
    console.log(`📡 [setKeywordSkipped] 準備送出 API (${skipped ? 'add' : 'remove'})`, {
      keyword,
      skipped,
      channelId: ACTIVE_CHANNEL_ID,
    });

    try {
      const res = await fetch(`/api/quick-editor/skip-keyword/${skipped ? 'add' : 'remove'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: ACTIVE_CHANNEL_ID,
          keyword,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('❌ [setKeywordSkipped] 後端回傳失敗', res.status, msg);
        throw new Error(msg);
      }

      console.log(`✅ [setKeywordSkipped] API 成功 (${skipped ? 'add' : 'remove'})`, keyword);

    } catch (err) {
      console.error('🔥 [setKeywordSkipped] 發送 API 失敗，還原狀態', err);
      set({ cards: prevCards });
      alert('更新略過狀態失敗，請稍後再試');
    }
  },


  setSubcategoryName: (keyword, newName) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.keyword === keyword ? { ...c, subcategoryName: newName } : c
      ),
    })),

  toggleMainCategory: (keyword, category) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.keyword === keyword
          ? {
            ...c,
            mainCategories: c.mainCategories.includes(category)
              ? c.mainCategories.filter((m) => m !== category)
              : [...c.mainCategories, category],
          }
          : c
      ),
    })),

  getAgreedCount: () => get().cards.filter((c) => c.agreed).length,

  getSavePayload: () => {
    const payload: Record<string, Record<string, string[]>> = {};

    for (const card of get().cards) {
      if (!card.agreed || card.mainCategories.length === 0) continue;

      for (const main of card.mainCategories) {
        if (!payload[main]) payload[main] = {};

        const key = card.subcategoryName;
        const alias = card.keyword;

        if (!payload[main][key]) payload[main][key] = [];

        if (alias !== key && !payload[main][key].includes(alias)) {
          payload[main][key].push(alias);
        }
      }
    }

    return payload;
  },
}));
