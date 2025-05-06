// hooks/store/editorStoreConfigActions.ts
// ------------------------------------------------------
// 分類設定相關：更新 / 新增主類別 / 新增遊戲分類 / 合併所有設定
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

  getMergedConfig: () => {
    const config = get().config;
    const merged: CategorySettings = {
      雜談: [],
      節目: [],
      音樂: [],
      其他: [],
      遊戲: [],
    };

    (['live', 'videos', 'shorts'] as VideoType[]).forEach((type) => {
      const c = config[type];
      if (!c) return;

      (['雜談', '節目', '音樂', '其他'] as NonGameMainCategory[]).forEach((main) => {
        merged[main].push(...(c[main] || []));
      });

      merged.遊戲.push(...(c.遊戲 || []));
    });

    return merged;
  },

  getFullMergedConfig: (): CategoryConfig => {
    const config = get().config;

    return {
      live: {
        雜談: [...(config.live?.雜談 ?? [])],
        節目: [...(config.live?.節目 ?? [])],
        音樂: [...(config.live?.音樂 ?? [])],
        其他: [...(config.live?.其他 ?? [])],
        遊戲: [...(config.live?.遊戲 ?? [])],
      },
      videos: {
        雜談: [...(config.videos?.雜談 ?? [])],
        節目: [...(config.videos?.節目 ?? [])],
        音樂: [...(config.videos?.音樂 ?? [])],
        其他: [...(config.videos?.其他 ?? [])],
        遊戲: [...(config.videos?.遊戲 ?? [])],
      },
      shorts: {
        雜談: [...(config.shorts?.雜談 ?? [])],
        節目: [...(config.shorts?.節目 ?? [])],
        音樂: [...(config.shorts?.音樂 ?? [])],
        其他: [...(config.shorts?.其他 ?? [])],
        遊戲: [...(config.shorts?.遊戲 ?? [])],
      },
    };
  },
});
