// hooks/store/editorStoreCustomKeywordActions.ts
// ------------------------------------------------------
// 初始化自訂關鍵字：排除來源關鍵字後，自動勾選可用自訂詞
// ------------------------------------------------------

import type { CategorySettings, GameEntry } from '../../types/editor';

export const getCustomKeywordActions = (set: any, get: any) => ({
  initCustomKeywordsFromConfig: (
    config: CategorySettings,
    bracketWords: string[],
    frequentWords: string[],
    gameEntries: GameEntry[],
  ) => {
    // 集合自動來源關鍵字
    const used = new Set<string>([
      ...bracketWords,
      ...frequentWords,
      ...gameEntries.map((g) => g.game),
      ...gameEntries.flatMap((g) => g.keywords),
    ]);

    // 從 config 的雜談／節目／音樂撈出未被佔用的
    const customSet = new Set<string>();
    for (const main of ['雜談', '節目', '音樂'] as const) {
      const arr = config[main] ?? [];
      for (const w of arr) if (!used.has(w)) customSet.add(w);
    }

    const customList = [...customSet];
    set((state) => ({
      customKeywords: customList,
      selectedBySource: {
        ...state.selectedBySource,
        custom: new Set(customList),
      },
      unsaved: true,
    }));
  },
});
