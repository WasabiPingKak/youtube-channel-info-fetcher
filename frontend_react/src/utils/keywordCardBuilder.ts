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
  mergedKeywords: Array<{ keyword: string; count: number }>,
  videos: ClassifiedVideoItem[],
  skipKeywords: string[],
  configMap: Map<string, Array<{ mainCategory: string; subcategoryName: string }>>
): SuggestedKeywordCardState[] {
  return mergedKeywords.map(({ keyword, count }) => {
    const skipped = skipKeywords.includes(keyword);
    let subcategoryName = '';
    let mainCategories: string[] = [];
    let agreed = false;

    if (configMap.has(keyword)) {
      const arr = configMap.get(keyword)!;
      subcategoryName = arr[0].subcategoryName;
      mainCategories = arr.map(x => x.mainCategory);
      agreed = true;
    }

    const normalizedKeyword = normalize(keyword);
    const matched = videos.filter((video) => normalize(video.title).includes(normalizedKeyword));

    return {
      keyword,
      count,
      agreed,
      skipped,
      subcategoryName,
      mainCategories,
      matchedVideos: matched,
    };
  })
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

