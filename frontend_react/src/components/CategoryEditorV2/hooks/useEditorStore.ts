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

export const useEditorStore = create<EditorState>((set, get) => ({
  /* ---------- state ---------- */
  channelId: '',
  config: {} as CategoryConfig,
  videos: [],
  activeType: 'live',
  unsaved: false,
  removedSuggestedKeywords: [],

  /* ---------- basic setters ---------- */
  setChannelId: (id: string) => set({ channelId: id }),
  setConfig: (cfg: CategoryConfig) => set({ config: cfg }),
  setVideos: (videos: Video[]) => set({ videos }),
  updateVideos: (videos: Video[]) => set({ videos }), // ✅ 新增這一行
  setActiveType: (type: VideoType) => set({ activeType: type }),
  setUnsaved: (flag: boolean) => set({ unsaved: flag }),
  markUnsaved: () => set({ unsaved: true }),

  /* ---------- keyword helpers ---------- */
  addRemovedKeyword: (word: string) =>
    set((state) => {
      if (state.removedSuggestedKeywords.includes(word)) return state;
      return {
        removedSuggestedKeywords: [
          ...state.removedSuggestedKeywords,
          word,
        ],
      };
    }),
  resetRemovedKeywords: () => set({ removedSuggestedKeywords: [] }),

  /* ---------- config updater ---------- */
  updateConfigOfType: (type: VideoType, settings: CategorySettings) =>
    set((state) => ({
      config: {
        ...state.config,
        [type]: settings,
      },
    })),

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
}));
