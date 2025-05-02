/* --------------------------------------------------------------------------
 * useEditorStore
 * --------------
 * 全域狀態管理（Zustand）
 * ------------------------------------------------------------------------ */

import { create } from 'zustand';
import type {
  CategoryConfig,
  CategorySettings,
  EditorState,
  Video,
  VideoType,
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

    /* ---------- basic setters ---------- */
    setActiveKeywordFilter: (kw: string | null) => set({ activeKeywordFilter: kw }),

    /* ---------- 建議詞相關 ---------- */
    addRemovedKeyword: (kw: string) => {
      const current = get().removedSuggestedKeywords;
      if (!current.includes(kw)) {
        set({ removedSuggestedKeywords: [...current, kw], unsaved: true });
      }
    },

    resetRemovedKeywords: () => {
      set({ removedSuggestedKeywords: [] });
    },

    addKeywordToCategory: (kw: string, category: string) => {
      const config = get().config;
      const active = get().activeType;
      const updated = { ...config };

      const currentList = updated[active]?.[category] ?? [];
      if (!currentList.includes(kw)) {
        const newList = [...currentList, kw];
        if (!updated[active]) updated[active] = { 雜談: [], 節目: [], 音樂: [], 遊戲: [], 其他: [] };
        updated[active][category] = newList;
        set({ config: updated, unsaved: true });
      }
    },

    getUnclassifiedVideos: () => {
      const filter = get().activeKeywordFilter;
      return get().videos.filter((v) => {
        const isTarget = v.matchedCategories.length === 0 || isOnlyOtherCategory(v);
        if (!filter) return isTarget;
        return isTarget && (
          v.matchedCategories.includes(filter) ||
          v.gameName === filter
        );
      });
    },

    getClassifiedVideos: () => {
      const filter = get().activeKeywordFilter;
      return get().videos.filter((v) => {
        const isTarget = v.matchedCategories.length > 0 && !isOnlyOtherCategory(v);
        if (!filter) return isTarget;
        return isTarget && (
          v.matchedCategories.includes(filter) ||
          v.gameName === filter
        );
      });
    },

    setChannelId: (id: string) => set({ channelId: id }),
    setConfig: (cfg: CategoryConfig) => set({ config: cfg }),
    setVideos: (videos: Video[]) => set({ videos }),
    updateVideos: (videos: Video[]) => set({ videos }),
    setActiveType: (type: VideoType) => set({ activeType: type }),
    setUnsaved: (flag: boolean) => set({ unsaved: flag }),

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

    /* ---------- reset whole store ---------- */
    resetStore: () =>
      set({
        channelId: '',
        config: {} as CategoryConfig,
        videos: [],
        activeType: 'live',
        unsaved: false,
        removedSuggestedKeywords: [],
        activeKeywordFilter: null,
      }),

    /* ---------- unsaved flag ---------- */
    markUnsaved: () => set({ unsaved: true }),
  };
});
