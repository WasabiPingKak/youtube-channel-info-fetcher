// types/editor.ts

export type VideoType = 'live' | 'videos' | 'shorts';
export type MainCategory = '雜談' | '節目' | '音樂' | '遊戲' | '其他';

export interface GameEntry {
  game: string;
  keywords: string[];
}

/* 先將『遊戲』排除，避免與 GameEntry[] 衝突 */
export type NonGameMainCategory = Exclude<MainCategory, '遊戲'>;
export type CategorySettings = Partial<Record<NonGameMainCategory, string[]>> & {
  遊戲?: GameEntry[];
};

// 🔖 Badge 型別定義
export type BadgeMain = MainCategory | '未分類';

/**
 * 用於 UI 顯示的雙層 Badge。
 * - 正常情況：{ main: MainCategory, keyword: string }
 * - 未分類：{ main: '未分類' } (keyword 省略)
 */
export type Badge =
  | { main: MainCategory; keyword: string }
  | { main: '未分類'; keyword?: undefined };

export interface CategoryConfig {
  live?: CategorySettings;
  videos?: CategorySettings;
  shorts?: CategorySettings;
}

export interface Video {
  videoId: string;
  title: string;
  publishDate: string;
  type: VideoType;
  category: MainCategory;
  matchedCategories: string[];
  gameName?: string;
  /** 前端顯示用 Badge 列表，不與後端同步 */
  badges?: Badge[];
}

export interface EditorState {
  selectedBySource: {
    bracket: Set<string>;
    frequency: Set<string>;
    game: Set<string>;
    custom: Set<string>;
  };

  toggleSuggestionChecked: (
    source: 'bracket' | 'frequency' | 'game' | 'custom',
    name: string,
    force?: boolean
  ) => void;

  channelId: string;
  config: CategoryConfig;
  videos: Video[];
  activeType: VideoType;
  unsaved: boolean;
  removedSuggestedKeywords: string[];
  activeKeywordFilter: string | null;

  // ✅ 加入 customKeywords 支援
  customKeywords: string[];
  setCustomKeywords: (list: string[]) => void;

  initCustomKeywordsFromConfig: (
    config: CategorySettings,
    bracketWords: string[],
    frequentWords: string[],
    gameEntries: GameEntry[]
  ) => void;

  /* 基本 setters */
  setChannelId: (id: string) => void;
  setConfig: (config: CategoryConfig) => void;
  setVideos: (videos: Video[]) => void;
  updateVideos: (videos: Video[]) => void;
  setActiveType: (type: VideoType) => void;
  setUnsaved: (flag: boolean) => void;
  markUnsaved: () => void;
  setActiveKeywordFilter: (kw: string | null) => void;

  /* 建議詞操作 */
  addRemovedKeyword: (kw: string) => void;
  resetRemovedKeywords: () => void;
  addKeywordToCategory: (kw: string, category: string) => void;

  /* 分類操作 */
  updateConfigOfType: (type: VideoType, settings: CategorySettings) => void;
  /**
   * 套用 badge：將 keyword 套用到指定主類別陣列
   */
  applyBadges: (keyword: string, categories: MainCategory[]) => void;
  /**
   * 依 keyword 批次移除所有主類別下的 badge
   */
  removeBadges: (keyword: string) => void;

  /* 清單邏輯 */
  getUnclassifiedVideos: () => Video[];
  getClassifiedVideos: () => Video[];

  /* 重置整體狀態 */
  resetStore: () => void;
}
