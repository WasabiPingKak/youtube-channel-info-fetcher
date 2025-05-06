import type { CategoryConfig, EditorState } from '../../types/editor';

export function getHydrationActions(
  set: (fn: (state: EditorState) => Partial<EditorState>) => void,
  get: () => EditorState
) {
  return {
    hydrateSelectionsFromConfig: (config: CategoryConfig) => {
      const selectedBySource: EditorState['selectedBySource'] = {
        bracket: new Set(),
        frequency: new Set(),
        game: new Set(),
        custom: new Set(),
      };

      const activeType = get().activeType;

      const settings = config[activeType] || {};

      for (const main of Object.keys(settings)) {
        if (main === '其他') continue;

        const entries = settings[main];

        for (const entry of entries) {
          if (typeof entry === 'string') {
            // 字串 → 加進三個區塊（由元件決定誰用）
            selectedBySource.bracket.add(entry);
            selectedBySource.frequency.add(entry);
            selectedBySource.custom.add(entry);
          } else if (typeof entry === 'object' && entry.game) {
            // 遊戲名稱只放進 game 區
            selectedBySource.game.add(entry.game);
          }
        }
      }

      set(() => ({
        selectedBySource,
      }));
    },
  };
}
