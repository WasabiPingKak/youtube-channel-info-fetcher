// hooks/store/editorStoreSyncActions.ts
// ------------------------------------------------------
// 設定同步邏輯：config / videos / badges
// ------------------------------------------------------

import type { CategoryConfig, Video, VideoType } from '../../types/editor';
import { defaultConfig } from '../../types/editor';
import { populateBadges } from '../utils/populateBadges';

export const getSyncActions = (set: any, get: any) => ({
  setConfig: (cfg: CategoryConfig) => {
    const { videos } = get();
    const type = videos[0]?.type || 'videos';
    const updatedVideos = populateBadges(videos, cfg[type] || {});
    set({ config: cfg, videos: updatedVideos });
    get().hydrateSelectionsFromConfig(cfg);
  },

  setVideos: (videos: Video[]) => {
    const { config } = get();
    const type = videos[0]?.type || 'videos';
    const updatedVideos = populateBadges(videos, config[type] || {});
    set({ videos: updatedVideos });
  },

  /**
   * 載入並用 defaultConfig 補齊欄位
   */
  loadConfig: (raw?: Partial<CategoryConfig>) => {
    const { videos } = get();
    const fullConfig = {
      live:   { ...defaultConfig.live,   ...raw?.live   },
      videos: { ...defaultConfig.videos, ...raw?.videos },
      shorts: { ...defaultConfig.shorts, ...raw?.shorts },
    };
    const type = videos[0]?.type || 'videos';
    const updatedVideos = populateBadges(videos, fullConfig[type] || {});

    set({
      config: fullConfig,
      videos: updatedVideos,
      unsaved: false,
    });
  },
});
