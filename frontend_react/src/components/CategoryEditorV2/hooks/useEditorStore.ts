// hooks/useEditorStore.ts
// ----------------------------------------------------
// Zustand store：影片分類編輯器的全域狀態管理中心
//
// 本檔僅定義基本 state 與單行 setter，所有複雜邏輯已模組化：
//   ✅ 分類設定管理（config / 遊戲 / 主分類）
//   ✅ Badge 操作（apply / remove）
//   ✅ 快取同步（setConfig / setVideos / loadConfig）
//   ✅ 關鍵字建議詞操作（建議詞篩選 / 移除 / 勾選狀態）
//   ✅ 自訂關鍵字初始化
//   ✅ 影片篩選（已分類 / 未分類）
//   ✅ 狀態重置
//
// 所有邏輯僅存在前端，與後端資料庫無同步行為。
// ----------------------------------------------------

import { create } from 'zustand';
import type {
  CategoryConfig,
  EditorState,
  Video,
  VideoType,
} from '../types/editor';

import {
  getConfigActions,
  getConfigRemovalActions,
  getBadgeActions,
  getFilterActions,
  getCustomKeywordActions,
  getSelectionActions,
  getCategoryActions,
  getSyncActions,
} from './store';


export const useEditorStore = create<EditorState>((set, get) => {
  /* ---------- state & actions ---------- */
  return {
    ...getConfigActions(set, get),
    ...getConfigRemovalActions(set, get),
    ...getBadgeActions(set, get),
    ...getFilterActions(set, get),
    ...getCustomKeywordActions(set, get),
    ...getSelectionActions(set, get),
    ...getCategoryActions(set, get),
    ...getSyncActions(set, get),

    /* ---------- 基本 state ---------- */
    channelId: '',
    config: {} as CategoryConfig,
    videos: [],
    activeType: 'live',
    unsaved: false,
    removedSuggestedKeywords: [],
    activeKeywordFilter: null,

    selectedBySource: {
      bracket: new Set<string>(),
      frequency: new Set<string>(),
      game: new Set<string>(),
      custom: new Set<string>(),
    },

    customKeywords: [],

    /* ---------- setters ---------- */
    setActiveKeywordFilter: (kw: string | null) => set({ activeKeywordFilter: kw }),
    setChannelId: (id: string) => set({ channelId: id }),
    updateVideos: (videos: Video[]) => set({ videos }),
    setActiveType: (type: VideoType) => set({ activeType: type }),
    setUnsaved: (flag: boolean) => set({ unsaved: flag }),
    markUnsaved: () => set({ unsaved: true }),

    setCustomKeywords: (list: string[]) => set({ customKeywords: list, unsaved: true }),

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
          bracket: new Set<string>(),
          frequency: new Set<string>(),
          game: new Set<string>(),
          custom: new Set<string>(),
        },
        customKeywords: [],
      }),
  };
});
