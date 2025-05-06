// hooks/store/editorStoreConfigRemovalActions.ts
// ------------------------------------------------------
// 分類設定 - 移除操作（遊戲 / 主分類 keyword）
// ------------------------------------------------------

import type { VideoType, NonGameMainCategory } from '../../types/editor';

export const getConfigRemovalActions = (set: any, get: any) => ({
  /**
   * 遊戲分類：移除
   */
  removeGameFromConfig: (type: VideoType, game: string) => {
    set((state) => {
      const section = state.config[type] || {};
      return {
        config: {
          ...state.config,
          [type]: {
            ...section,
            遊戲: (section.遊戲 || []).filter((g) => g.game !== game),
          },
        },
        unsaved: true,
      };
    });
  },

  /**
   * 主分類：移除 keyword
   */
  removeKeywordFromConfig: (
    type: VideoType,
    main: NonGameMainCategory,
    keyword: string
  ) => {
    set((state) => {
      const section = state.config[type] || {};
      return {
        config: {
          ...state.config,
          [type]: {
            ...section,
            [main]: (section[main] || []).filter((k) => k !== keyword),
          },
        },
        unsaved: true,
      };
    });
  },
});
