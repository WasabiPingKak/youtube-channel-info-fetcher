import { create } from 'zustand';
import type {
  CategoryConfig,
  CategorySettings,
  EditorState,
  Video,
  VideoType,
  GameEntry,
} from '../types/editor';

export const useEditorStore = create<EditorState>((set, get) => {
  const isOnlyOtherCategory = (video: Video) =>
    video.matchedCategories.length === 1 && video.matchedCategories[0] === '其他';

  return {
    /* ---------- state ---------- */
    channelId: '',
    config: {} as CategoryConfig,
    videos: [],
    activeType: 'live',
    unsaved: false,
    removedSuggestedKeywords: [],
    activeKeywordFilter: null,

    selectedBySource: {
      bracket: new Set(),
      frequency: new Set(),
      game: new Set(),
      custom: new Set(),
    },

    customKeywords: [],

    /* ---------- basic setters ---------- */
    setActiveKeywordFilter: (kw: string | null) => set({ activeKeywordFilter: kw }),
    setChannelId: (id: string) => set({ channelId: id }),
    setConfig: (cfg: CategoryConfig) => set({ config: cfg }),
    setVideos: (videos: Video[]) => set({ videos }),
    updateVideos: (videos: Video[]) => set({ videos }),
    setActiveType: (type: VideoType) => set({ activeType: type }),
    setUnsaved: (flag: boolean) => set({ unsaved: flag }),
    markUnsaved: () => set({ unsaved: true }),

    setCustomKeywords: (list: string[]) =>
      set({ customKeywords: list, unsaved: true }),

    /* ---------- 建議詞相關 ---------- */
    addRemovedKeyword: (kw: string) => {
      const current = get().removedSuggestedKeywords;
      if (!current.includes(kw)) {
        set({ removedSuggestedKeywords: [...current, kw], unsaved: true });
      }
    },
    resetRemovedKeywords: () => set({ removedSuggestedKeywords: [] }),

    toggleSuggestionChecked: (source, name, force) => {
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

    /* ---------- 關鍵字分類操作 ---------- */
    addKeywordToCategory: (kw: string, category: string) => {
      const config = get().config;
      const active = get().activeType;
      const updated = { ...config };

      const currentList = updated[active]?.[category] ?? [];
      if (!currentList.includes(kw)) {
        const newList = [...currentList, kw];
        if (!updated[active])
          updated[active] = { 雜談: [], 節目: [], 音樂: [], 遊戲: [], 其他: [] };
        updated[active][category] = newList;
        set({ config: updated, unsaved: true });
      }
    },

    /* ---------- 類別影片篩選 ---------- */
    getUnclassifiedVideos: () => {
      const filter = get().activeKeywordFilter;
      return get().videos.filter((v) => {
        const isTarget = v.matchedCategories.length === 0 || isOnlyOtherCategory(v);
        if (!filter) return isTarget;
        return isTarget && (v.matchedCategories.includes(filter) || v.gameName === filter);
      });
    },
    getClassifiedVideos: () => {
      const filter = get().activeKeywordFilter;
      return get().videos.filter((v) => {
        const isTarget = v.matchedCategories.length > 0 && !isOnlyOtherCategory(v);
        if (!filter) return isTarget;
        return (
          isTarget &&
          (v.title.includes(filter) ||
            v.matchedCategories.includes(filter) ||
            v.gameName === filter)
        );
      });
    },

    /* ---------- config updater ---------- */
    updateConfigOfType: (type: VideoType, settings: CategorySettings) => {
      const current = get().config;
      set({
        config: {
          ...current,
          [type]: settings,
        },
      });
    },

    /* ---------- 初始化自訂關鍵字 ---------- */
    initCustomKeywordsFromConfig: (
      config: CategorySettings,
      bracketWords: string[],
      frequentWords: string[],
      gameEntries: GameEntry[]
    ) => {
      // 先收集自動來源已用關鍵字
      const used = new Set<string>([
        ...bracketWords,
        ...frequentWords,
        ...gameEntries.map((g) => g.game),
        ...gameEntries.flatMap((g) => g.keywords),
      ]);

      // 從 config 的雜談/節目/音樂撈出未被自動來源佔用的字
      const customSet = new Set<string>();
      for (const main of ['雜談', '節目', '音樂'] as const) {
        const arr = config[main] ?? [];
        for (const w of arr) {
          if (!used.has(w)) customSet.add(w);
        }
      }

      const customList = [...customSet];
      // 一次性更新 customKeywords 並預設勾選
      set((state) => ({
        customKeywords: customList,
        selectedBySource: {
          ...state.selectedBySource,
          custom: new Set(customList),
        },
        unsaved: true,
      }));
    },

    /* ---------- reset ---------- */
    resetStore: () =>
      set({
        channelId: '',
        config: {} as CategoryConfig,
        videos: [],
        activeType: 'live',
        unsaved: false,
        removedSuggestedKeywords: [],
        activeKeywordFilter: null,
        selectedBySource: {
          bracket: new Set(),
          frequency: new Set(),
          game: new Set(),
          custom: new Set(),
        },
        customKeywords: [],
      }),
  };
});
