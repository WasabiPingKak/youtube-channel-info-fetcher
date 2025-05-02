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

    /* ---------- basic setters ---------- */
    getUnclassifiedVideos: () =>
      get().videos.filter(v =>
        v.matchedCategories.length === 0 || isOnlyOtherCategory(v)
      ),

    getClassifiedVideos: () =>
      get().videos.filter(v =>
        v.matchedCategories.length > 0 && !isOnlyOtherCategory(v)
      ),

    setChannelId: (id: string) => set({ channelId: id }),
    setConfig: (cfg: CategoryConfig) => set({ config: cfg }),
    setVideos: (videos: Video[]) => set({ videos }),
    updateVideos: (videos: Video[]) => set({ videos }),
    setActiveType: (type: VideoType) => set({ activeType: type }),
    setUnsaved: (flag: boolean) => set({ unsaved: flag }),

    /* ---------- keyword helpers ---------- */
    addRemovedKeyword: (word: string) => {
      const current = get().removedSuggestedKeywords;
      if (!current.includes(word)) {
        set({ removedSuggestedKeywords: [...current, word] });
      }
    },

    resetRemovedKeywords: () => {
      set({ removedSuggestedKeywords: [] });
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

    /* ---------- reset whole store ---------- */
    resetStore: () =>
      set({
        channelId: '',
        config: {} as CategoryConfig,
        videos: [],
        activeType: 'live',
        unsaved: false,
        removedSuggestedKeywords: [],
      }),

    /* ---------- unsaved flag ---------- */
    markUnsaved: () => set({ unsaved: true }),
  };
});
