// hooks/store/editorStoreBadgeActions.ts
// ------------------------------------------------------
// Badge 操作：批次套用 applyBadges / 批次移除 removeBadges
// ------------------------------------------------------

import type { MainCategory, Video } from '../../types/editor';

/**
 * 判斷影片是否被指定關鍵字命中
 */
const isVideoHitByKeyword = (video: Video, keyword: string) => {
  if (!keyword) return false;
  return (
    video.title.toLowerCase().includes(keyword.toLowerCase()) ||
    video.matchedCategories.includes(keyword.toLowerCase()) ||
    video.gameName === keyword
  );
};

/**
 * 若影片無 badge，補上未分類
 */
const ensureUncategorizedBadge = (video: Video) => {
  if (!video.badges || video.badges.length === 0) {
    video.badges = [{ main: '未分類' }];
  } else {
    video.badges = video.badges.filter((b) => b.main !== '未分類');
    if (video.badges.length === 0) video.badges.push({ main: '未分類' });
  }
};

export const getBadgeActions = (set: any, get: any) => ({
  /**
   * ➕ 批次套用：對命中影片加入 [主類別[keyword]]
   */
  applyBadges: (keyword: string, categories: MainCategory[]) => {
    categories.forEach((cat) => {
      if (cat === '遊戲') {
        get().addGameToConfig('videos', keyword, []);
      } else {
        get().addKeywordToConfig('videos', cat, keyword);
      }
    });

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

  /**
   * ➖ 批次移除：依 keyword 刪除所有主類別 badge
   */
  removeBadges: (keyword: string) => {
    get().removeGameFromConfig('videos', keyword);
    (['雜談', '節目', '音樂', '其他'] as const).forEach((main) => {
      get().removeKeywordFromConfig('videos', main, keyword);
    });

    const all = get().videos.map((v) => ({ ...v }));
    all.forEach((v) => {
      if (!v.badges || v.badges.length === 0) return;
      v.badges = v.badges.filter((b) => b.keyword !== keyword);
      ensureUncategorizedBadge(v);
    });

    set({ videos: all, unsaved: true });
  },
});
