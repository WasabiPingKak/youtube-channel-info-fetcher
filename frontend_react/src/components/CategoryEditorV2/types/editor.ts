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

  activeKeywordFilter: string | null;

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

  /* 清單邏輯 */
  getUnclassifiedVideos: () => Video[];
  getClassifiedVideos: () => Video[];

  /* 重置整體狀態 */
  resetStore: () => void;
}

