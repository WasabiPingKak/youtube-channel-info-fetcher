// hooks/store/editorStoreConfigActions.ts
// ------------------------------------------------------
// 分類設定相關：更新 / 新增主類別 / 新增遊戲分類
// ------------------------------------------------------

import type {
    Video,
    VideoType,
    CategorySettings,
    CategoryConfig,
    MainCategory,
    NonGameMainCategory,
  } from '../../types/editor';
  import { generateBadgesForVideo } from '../utils/badgeUtils';

  export const getConfigActions = (set: any, get: any) => ({
    updateConfigOfType: (type: VideoType, settings: CategorySettings) => {
      const { config, videos } = get();
      const newConfig: CategoryConfig = {
        ...config,
        [type]: settings,
      };

      const updatedVideos = videos.map((v) =>
        v.type !== type ? v : { ...v, badges: generateBadgesForVideo(v, settings ?? {}) }
      );

      set({
        config: newConfig,
        videos: updatedVideos,
        unsaved: true,
      });
    },

    addKeywordToConfig: (
      type: VideoType,
      main: NonGameMainCategory,
      keyword: string
    ) => {
      const { config } = get();
      const newConfig: CategoryConfig = {
        ...config,
        [type]: {
          ...config[type],
          [main]: [...(config[type]?.[main] ?? []), keyword],
        },
      };
      set({ config: newConfig, unsaved: true });
    },

    addGameToConfig: (type: VideoType, game: string, keywords: string[] = []) => {
      const { config } = get();
      const newGame = { game, keywords };
      const oldList = config[type]?.遊戲 ?? [];
      const newConfig: CategoryConfig = {
        ...config,
        [type]: {
          ...config[type],
          遊戲: [...oldList, newGame],
        },
      };
      set({ config: newConfig, unsaved: true });
    },
  });
