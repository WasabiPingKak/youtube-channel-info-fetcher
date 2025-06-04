import { create } from 'zustand';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';

interface QuickCategoryEditorStore {
  cards: SuggestedKeywordCardState[];

  initializeCards: (cards: SuggestedKeywordCardState[]) => void;

  toggleAgree: (keyword: string) => void;
  toggleSkip: (keyword: string) => void;
  setSubcategoryName: (keyword: string, newName: string) => void;
  toggleMainCategory: (keyword: string, category: string) => void;

  getAgreedCount: () => number;
  getSavePayload: () => Record<string, Record<string, string[]>>;
}

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
