// hooks/store/editorStoreSelectionActions.ts
// ------------------------------------------------------
// 建議詞／來源選取狀態管理
// ------------------------------------------------------

import type { KeywordSource } from '../../types/editor';

export const getSelectionActions = (set: any, get: any) => ({
  /**
   * 建議詞來源區塊：選取狀態切換
   */
  toggleSuggestionChecked: (
    source: KeywordSource,
    name: string,
    force?: boolean
  ) => {
    const current = get().selectedBySource[source];
    const updated = new Set(current);
    const shouldCheck = typeof force === 'boolean' ? force : !current.has(name);

    if (shouldCheck) updated.add(name);
    else updated.delete(name);

    set((state) => ({
      selectedBySource: {
        ...state.selectedBySource,
        [source]: updated,
      },
      unsaved: true,
    }));
  },

  /**
   * 新增移除建議詞
   */
  addRemovedKeyword: (kw: string) => {
    const current = get().removedSuggestedKeywords;
    if (!current.includes(kw.toLowerCase())) {
      set({ removedSuggestedKeywords: [...current, kw], unsaved: true });
    }
  },

  /**
   * 重置所有移除建議詞
   */
  resetRemovedKeywords: () => set({ removedSuggestedKeywords: [] }),
});
