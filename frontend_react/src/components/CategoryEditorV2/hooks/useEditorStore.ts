/**
 * useEditorStore
 * --------------
 * Zustand store：統一管理 CategoryEditor 編輯狀態
 */

import { create } from 'zustand';
import type {
  CategoryConfig,
  CategorySettings,
  EditorState,
  Video,
  VideoType,
} from '../types/editor';

export const useEditorStore = create<EditorState>((set) => ({
  // ---------- state ----------
  channelId: '',
  config: {} as CategoryConfig,
  videos: [],
  activeType: 'live',
  unsaved: false,
  removedSuggestedKeywords: [],

  // ---------- actions ----------
  setChannelId: (id) => set({ channelId: id }),

  setConfig: (config) => set({ config }),

  /** 僅更新指定 type 的 CategorySettings */
  updateConfigOfType: (type: VideoType, newSettings: CategorySettings) =>
    set((state) => ({
      config: { ...state.config, [type]: newSettings },
      unsaved: true,
    })),

  setVideos: (videos: Video[]) => set({ videos }),

  setActiveType: (type) => set({ activeType: type }),

  markUnsaved: (flag) => set({ unsaved: flag }),

  addRemovedKeyword: (word) =>
    set((state) => ({
      removedSuggestedKeywords: [
        ...state.removedSuggestedKeywords,
        word,
      ],
    })),

  resetRemovedKeywords: () => set({ removedSuggestedKeywords: [] }),

  /** 切換頻道時快速重置 store */
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
