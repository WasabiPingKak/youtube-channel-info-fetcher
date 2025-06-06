import type { ClassifiedVideoItem } from '@/hooks/useClassifiedVideos';
import type { SuggestedKeyword } from '@/hooks/useFrequentKeywordSuggestions';
import { normalize } from '@/utils/textUtils';

export interface SuggestedKeywordCardState {
  keyword: string;
  count: number;
  agreed: boolean;
  skipped: boolean;
  subcategoryName: string;
  isSaving?: boolean;
  isSuccess?: boolean;
  mainCategories: string[]; // 雜談 / 遊戲 / 節目 / 音樂
  matchedVideos: ClassifiedVideoItem[];
}

/**
 * 根據高頻詞與影片清單，建立分類建議卡片的初始狀態陣列
 * @param keywords 高頻關鍵字建議
 * @param videos 所有影片（含已分類與未分類）
 * @param skipKeywords 略過的關鍵字列表
 * @param configMap 使用者分類設定：keyword -> { mainCategory, subcategoryName }
 */
export function buildSuggestedKeywordCards(
  keywords: SuggestedKeyword[],
  videos: ClassifiedVideoItem[],
  skipKeywords: string[] = [],
  configMap?: Map<string, { mainCategory: string; subcategoryName: string }>
): SuggestedKeywordCardState[] {
  console.log('[🧩 buildSuggestedKeywordCards]');
  console.log('  keywords.length:', keywords.length);
  console.log('  videos.length:', videos.length);
  console.log('  skipKeywords.length:', skipKeywords.length);
  console.log('  configMap size:', configMap?.size ?? 0);

  return keywords
    .map(({ keyword, count }) => {
      const lowerKeyword = keyword.toLowerCase();

      // 找出所有命中該 keyword 的影片（但需經過進一步條件過濾）
      const matched = videos.filter((v) => {
        const tokens = normalize(v.title).split(' ').map((t) => t.trim());
        const hit = tokens.includes(lowerKeyword);
        if (!hit) return false;

        const isUnclassified = v.matchedCategories?.includes('未分類');
        const isMatchedByUserConfig = configMap?.has(lowerKeyword);

        return isUnclassified || isMatchedByUserConfig;
      });

      let agreed = false;
      let mainCategories: string[] = [];
      let subcategoryName = keyword;

      if (configMap?.has(keyword)) {
        agreed = true;
        // 找出所有主分類 / 子分類組合
        const matchedEntries = Array.from(configMap.entries())
          .filter(([k]) => k === keyword)
          .map(([, v]) => v);

        mainCategories = [...new Set(matchedEntries.map((e) => e.mainCategory))];

        if (matchedEntries.length > 0) {
          subcategoryName = matchedEntries[0].subcategoryName;
        }
      }

      return {
        keyword,
        count,
        agreed,
        skipped: skipKeywords.includes(keyword),
        subcategoryName,
        mainCategories,
        matchedVideos: matched,
      };
    })
    // 不過濾任何卡片（即使 matchedVideos.length === 0）
    .sort((a, b) => {
      if (b.matchedVideos.length !== a.matchedVideos.length) {
        return b.matchedVideos.length - a.matchedVideos.length;
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.keyword.localeCompare(b.keyword);
    });
}
