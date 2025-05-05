// hooks/useEditorStore.ts
// ----------------------------------------------------
// Zustand store：管理影片分類編輯器整體狀態
// 2025‑05‑05 依最新規格新增：
//   • Badge 雙層結構（外層主類別顏色；內層 keyword 隨機色，同 keyword 恆同色）
//   • applyBadges / removeBadges 以 keyword 批次套用／移除
//   • 未分類影片自動補灰色 [未分類] badge
//   • 所有邏輯僅存在前端，不與後端同步
// ----------------------------------------------------

import { create } from 'zustand';
import type {
  CategoryConfig,
  CategorySettings,
  EditorState,
  Video,
  VideoType,
  GameEntry,
  Badge,
  MainCategory,
  NonGameMainCategory,
} from '../types/editor';
import { generateBadgesForVideo } from './utils/badgeUtils';

export const useEditorStore = create<EditorState>((set, get) => {

  const populateBadgesFromConfig = () => {
    const { videos, config } = get();
    if (!videos.length || !Object.keys(config).length) return;

    const withBadges = videos.map((v) =>
      v.badges?.length ? v : { ...v, badges: generateBadgesForVideo(v, config[v.type]) },
    );
    set({ videos: withBadges });
  };

  /* ---------- utilities ---------- */

  /** 當影片僅有 matchedCategories=['其他'] 時，用於舊邏輯判定 */
  const isOnlyOtherCategory = (video: Video) =>
    video.matchedCategories.length === 1 && video.matchedCategories[0] === '其他';

  /** 字串 → HSL 色相，確保同 keyword 一致顏色 */
  const getKeywordColor = (kw: string) => {
    let hash = 0;
    for (let i = 0; i < kw.length; i++) hash = (hash * 31 + kw.charCodeAt(i)) % 360;
    return `hsl(${hash} 70% 75%)`;
  };

  /** 判斷影片是否被目前 keyword 命中（沿用舊篩選邏輯） */
  const isVideoHitByKeyword = (video: Video, keyword: string) => {
    if (!keyword) return false;
    return (
      video.title.toLowerCase().includes(keyword.toLowerCase()) ||
      video.matchedCategories.includes(keyword.toLowerCase()) ||
      video.gameName === keyword
    );
  };

  /** 確保影片至少有 1 badge；若沒有則補 '未分類' */
  const ensureUncategorizedBadge = (video: Video) => {
    if (!video.badges || video.badges.length === 0) {
      video.badges = [{ main: '未分類' }];
    } else {
      video.badges = video.badges.filter((b) => b.main !== '未分類');
      if (video.badges.length === 0) video.badges.push({ main: '未分類' });
    }
  };

  /* ---------- state & actions ---------- */
  return {
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
    setConfig: (cfg: CategoryConfig) => {
      set({ config: cfg });
      populateBadgesFromConfig();
    },
    setVideos: (videos: Video[]) => {
      set({ videos });
      populateBadgesFromConfig();
    },
    updateVideos: (videos: Video[]) => set({ videos }),
    setActiveType: (type: VideoType) => set({ activeType: type }),
    setUnsaved: (flag: boolean) => set({ unsaved: flag }),
    markUnsaved: () => set({ unsaved: true }),

    setCustomKeywords: (list: string[]) => set({ customKeywords: list, unsaved: true }),

    /* ---------- 建議詞操作 ---------- */
    addRemovedKeyword: (kw: string) => {
      const current = get().removedSuggestedKeywords;
      if (!current.includes(kw.toLowerCase())) {
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

    /* ---------- 🆕  Batch Badge 操作 ---------- */
    /** ➕ 批次套用：對命中影片加入 [主類別[keyword]] */
    applyBadges: (keyword: string, categories: MainCategory[]) => {
      const all = get().videos.map((v) => ({ ...v }));
      all.forEach((v) => {
        if (!isVideoHitByKeyword(v, keyword)) return;
        if (!v.badges) v.badges = [];

        categories.forEach((cat) => {
          const exists = v.badges!.some(
            (b) => b.main === cat && b.keyword === keyword,
          );
          if (!exists) {
            v.badges!.push({ main: cat, keyword });
          }
        });

        // 移除未分類占位
        v.badges = v.badges.filter((b) => b.main !== '未分類');
      });

      set({ videos: all, unsaved: true });
    },

    /** ➖ 批次移除：依 keyword 刪除所有主類別 badge */
    removeBadges: (keyword: string) => {
      const all = get().videos.map((v) => ({ ...v }));
      all.forEach((v) => {
        if (!v.badges || v.badges.length === 0) return;
        v.badges = v.badges.filter((b) => b.keyword !== keyword);
        ensureUncategorizedBadge(v);
      });

      set({ videos: all, unsaved: true });
    },

    /* ---------- 影片篩選 ---------- */
    getUnclassifiedVideos: () => {
      const filter = get().activeKeywordFilter;
      return get().videos.filter((v) => {
        const isTarget =
          !v.badges || v.badges.every((b) => b.main === '未分類');
        if (!filter) return isTarget;
        return isTarget && isVideoHitByKeyword(v, filter);
      });
    },
    getClassifiedVideos: () => {
      const filter = get().activeKeywordFilter;
      return get().videos.filter((v) => {
        const isTarget =
          v.badges && v.badges.some((b) => b.main !== '未分類');
        if (!filter) return isTarget;
        return isTarget && isVideoHitByKeyword(v, filter);
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
