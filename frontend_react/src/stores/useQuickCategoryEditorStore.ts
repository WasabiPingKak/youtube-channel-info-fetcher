import { create } from 'zustand';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import { useQuickCategoryApply } from '@/hooks/useQuickCategoryApply';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

interface QuickCategoryEditorStore {
  channelId: string;
  cards: SuggestedKeywordCardState[];

  initializeCards: (cards: SuggestedKeywordCardState[]) => void;
  setChannelId: (id: string) => void;

  toggleAgree: (keyword: string) => void;
  applyAgree: (keyword: string) => Promise<void>;
  removeAppliedKeyword: (keyword: string) => Promise<void>;

  toggleSkip: (keyword: string) => void;
  setKeywordSkipped: (keyword: string, skipped: boolean) => Promise<void>;

  setSubcategoryName: (keyword: string, newName: string) => void;
  toggleMainCategory: (keyword: string, category: string) => void;

  getAgreedCount: () => number;
  getSavePayload: () => Record<string, Record<string, string[]>>;
}

export const useQuickCategoryEditorStore = create<QuickCategoryEditorStore>((set, get) => {
  const applyQuickCategory = useQuickCategoryApply();

  return {
    channelId: '',

    cards: [],

    setChannelId: (id) => {
      set({ channelId: id });
    },

    initializeCards: (newCards) => {
      // 每張卡片預設補上 isSaving 與 isSuccess
      const initialized = newCards.map((card) => ({
        ...card,
        isSaving: false,
      }));
      set({ cards: initialized });
    },

    toggleAgree: (keyword) =>
      set((state) => ({
        cards: state.cards.map((c) =>
          c.keyword === keyword ? { ...c, agreed: !c.agreed, skipped: false } : c
        ),
      })),

    applyAgree: async (keyword) => {
      const state = get();
      const prevCards = state.cards;
      const card = state.cards.find((c) => c.keyword === keyword);
      if (!card) return;

      if (card.mainCategories.length === 0) {
        alert('請先選擇至少一個主分類');
        return;
      }

      // ➤ 標記儲存中
      set({
        cards: state.cards.map((c) =>
          c.keyword === keyword ? { ...c, isSaving: true, skipped: false } : c
        ),
      });

      const targets = card.mainCategories.map((mainCategory) => ({
        mainCategory,
        subcategoryName: card.subcategoryName,
      }));

      try {
        await applyQuickCategory(state.channelId, keyword, targets);

        // ➤ 儲存成功
        set({
          cards: get().cards.map((c) =>
            c.keyword === keyword
              ? {
                ...c,
                agreed: true,
                isSaving: false,
                isSuccess: true,
                skipped: false,
              }
              : c
          ),
        });
        toast.success(`已成功將「${keyword}」分類為：${card.mainCategories.join('、')}`);
      } catch (err) {
        console.error('❌ [applyAgree] API 發送失敗，還原狀態：', err);
        set({ cards: prevCards });
        toast.error(`分類儲存失敗：「${keyword}」`);
      }
    },

    removeAppliedKeyword: async (keyword) => {
      const state = get();
      const prevCards = state.cards;

      const card = prevCards.find((c) => c.keyword === keyword);
      if (!card) return;

      // 標記儲存中
      set({
        cards: prevCards.map((c) =>
          c.keyword === keyword ? { ...c, isSaving: true } : c
        ),
      });

      try {
        const res = await apiPost('/api/quick-editor/channel-config-remove', {
          channelId: state.channelId,
          keyword,
        });

        if (!res.ok) {
          const msg = await res.text();
          console.error('❌ [removeAppliedKeyword] API 回傳失敗', res.status, msg);
          throw new Error(msg);
        }

        // 成功 → 還原為未分類狀態
        set({
          cards: get().cards.map((c) =>
            c.keyword === keyword
              ? {
                ...c,
                agreed: false,
                isSaving: false,
                isSuccess: false,
              }
              : c
          ),
        });

        toast.success(`已撤銷分類設定：「${keyword}」`);
      } catch (err) {
        console.error('🔥 [removeAppliedKeyword] 發送 API 失敗，還原狀態', err);
        set({ cards: prevCards });
        toast.error(`撤銷分類失敗：「${keyword}」`);
      }
    },

    toggleSkip: (keyword) =>
      set((state) => ({
        cards: state.cards.map((c) =>
          c.keyword === keyword
            ? {
              ...c,
              skipped: !c.skipped,
              agreed: false,
              isSaving: false,
              isSuccess: false,
            }
            : c
        ),
      })),

    setKeywordSkipped: async (keyword, skipped) => {
      const prevCards = get().cards;
      const newCards = prevCards.map((c) =>
        c.keyword === keyword
          ? {
            ...c,
            skipped,
            agreed: false,
            isSaving: false,
            isSuccess: false,
          }
          : c
      );
      set({ cards: newCards });

      const channelId = get().channelId;
      try {
        const res = await apiPost(`/api/quick-editor/skip-keyword/${skipped ? 'add' : 'remove'}`, {
          channelId,
          keyword,
        });

        if (!res.ok) {
          const msg = await res.text();
          console.error('❌ [setKeywordSkipped] 後端回傳失敗', res.status, msg);
          throw new Error(msg);
        }

        toast.success(skipped ? `已略過「${keyword}」` : `已取消略過「${keyword}」`);
      } catch (err) {
        console.error('🔥 [setKeywordSkipped] 發送 API 失敗，還原狀態', err);
        set({ cards: prevCards });
        toast.error(`更新略過狀態失敗：「${keyword}」`);
      }
    },

    setSubcategoryName: (keyword, newName) =>
      set((state) => ({
        cards: state.cards.map((c) =>
          c.keyword === keyword
            ? {
              ...c,
              subcategoryName: newName.trim() === '' ? keyword : newName.trim(),
            }
            : c
        ),
      })),

    toggleMainCategory: (keyword, category) =>
      set((state) => ({
        cards: state.cards.map((c) => {
          if (c.keyword !== keyword) return c;
          const already = c.mainCategories.includes(category);
          const updatedCategories = already
            ? c.mainCategories.filter((m) => m !== category)
            : [...c.mainCategories, category];
          return {
            ...c,
            mainCategories: updatedCategories,
          };
        }),
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
  };
});
