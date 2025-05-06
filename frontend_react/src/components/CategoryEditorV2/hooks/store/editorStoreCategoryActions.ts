// hooks/store/editorStoreCategoryActions.ts
// ------------------------------------------------------
// 主分類關鍵字操作：addKeywordToCategory
// ------------------------------------------------------

import type { CategoryConfig, CategorySettings, NonGameMainCategory } from '../../types/editor';

export const getCategoryActions = (set: any, get: any) => ({
  /**
   * 新增 keyword 至指定主分類（僅限非遊戲類別）
   */
  addKeywordToCategory: (kw: string, category: NonGameMainCategory) => {
    const config = get().config;
    const active = get().activeType;
    const updated: CategoryConfig = { ...config };

    // 取得目前主分類的字串陣列（僅限非遊戲）
    const currentList =
      (updated[active]?.[category] as string[] | undefined) ?? [];

    if (!currentList.includes(kw.toLowerCase())) {
      const newList = [...currentList, kw];

      // 若該 activeType 尚未存在，先初始化
      if (!updated[active]) {
        updated[active] = {
          雜談: [],
          節目: [],
          音樂: [],
          其他: [],
        } as CategorySettings;
      }

      (updated[active]![category] as string[]) = newList;
      set({ config: updated, unsaved: true });
    }
  },
});
