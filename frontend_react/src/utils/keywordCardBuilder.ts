import type { ClassifiedVideoItem } from '@/hooks/useClassifiedVideos';
import type { SuggestedKeyword } from '@/hooks/useFrequentKeywordSuggestions';
import { normalize } from '@/utils/textUtils';

export interface SuggestedKeywordCardState {
  keyword: string;
  count: number;
  agreed: boolean;
  skipped: boolean;
  subcategoryName: string;
  mainCategories: string[]; // 雜談 / 遊戲 / 節目 / 音樂
  matchedVideos: ClassifiedVideoItem[];
}

/**
 * 根據高頻詞與影片清單，建立分類建議卡片的初始狀態陣列
 */
export function buildSuggestedKeywordCards(
  keywords: SuggestedKeyword[],
  videos: ClassifiedVideoItem[]
): SuggestedKeywordCardState[] {
  const unclassifiedVideos = videos.filter(
    (v) => v.matchedCategories?.length === 1 && v.matchedCategories[0] === '未分類'
  );

  console.log('[🧩 buildSuggestedKeywordCards]');
  console.log('  keywords.length:', keywords.length);
  console.log('  unclassifiedVideos.length:', unclassifiedVideos.length);

  return keywords
    .map(({ keyword, count }) => {
      const matched = unclassifiedVideos.filter((v) => {
        const tokens = normalize(v.title).split(' ').map((t) => t.trim());
        return tokens.includes(keyword.toLowerCase());
      });

      return {
        keyword,
        count,
        agreed: false,
        skipped: false,
        subcategoryName: keyword,
        mainCategories: [],
        matchedVideos: matched,
      };
    })
    .filter((card) => card.matchedVideos.length > 0)
    .sort((a, b) => b.matchedVideos.length - a.matchedVideos.length); // ✅ 根據影片命中數排序

}

