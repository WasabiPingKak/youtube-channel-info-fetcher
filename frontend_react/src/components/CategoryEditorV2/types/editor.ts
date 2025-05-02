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
}

export interface EditorState {
  channelId: string;
  config: CategoryConfig;
  videos: Video[];
  activeType: VideoType;
  unsaved: boolean;
  removedSuggestedKeywords: string[];

  /* 基本 setters */
  setChannelId: (id: string) => void;
  setConfig: (config: CategoryConfig) => void;
  setVideos: (videos: Video[]) => void;
  setActiveType: (type: VideoType) => void;
  markUnsaved: () => void;
  setUnsaved: (flag: boolean) => void;
  updateVideos: (videos: Video[]) => void;

  /* 關鍵字相關 */
  addRemovedKeyword: (kw: string) => void;
  resetRemovedKeywords: () => void;
  addKeywordToCategory: (kw: string, category: string) => void;

  /* 分類設定更新 */
  updateConfigOfType: (
    type: VideoType,
    settings: CategorySettings
  ) => void;

  /* 整個 Store 重置 */
  resetStore: () => void;

  /* 分類清單 getter（含過濾邏輯） */
  getUnclassifiedVideos: () => Video[];
  getClassifiedVideos: () => Video[];
}
