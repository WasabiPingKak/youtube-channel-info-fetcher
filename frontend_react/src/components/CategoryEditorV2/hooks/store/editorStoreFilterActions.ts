// hooks/store/editorStoreFilterActions.ts
// ------------------------------------------------------
// 影片過濾：未分類 / 已分類（可選擇是否被 keyword 命中）
// ------------------------------------------------------

import type { Video } from '../../types/editor';

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

export const getFilterActions = (set: any, get: any) => ({
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
});
