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
 * @param videos 所有影片（未分類過濾）
 * @param skipKeywords 略過的關鍵字列表
 * @param configMap 來自 firestore config 的 keyword 對應分類資訊（可為多對一）
 */
export function buildSuggestedKeywordCards(
  keywords: SuggestedKeyword[],
  videos: ClassifiedVideoItem[],
  skipKeywords: string[] = [],
  configMap?: Map<string, { mainCategory: string; subcategoryName: string }>
): SuggestedKeywordCardState[] {
  const unclassifiedVideos = videos.filter(
    (v) => v.matchedCategories?.length === 1 && v.matchedCategories[0] === '未分類'
  );

  console.log('[🧩 buildSuggestedKeywordCards]');
  console.log('  keywords.length:', keywords.length);
  console.log('  unclassifiedVideos.length:', unclassifiedVideos.length);
  console.log('  skipKeywords.length:', skipKeywords.length);
  console.log('  configMap size:', configMap?.size ?? 0);

  return keywords
    .map(({ keyword, count }) => {
      const matched = unclassifiedVideos.filter((v) => {
        const tokens = normalize(v.title).split(' ').map((t) => t.trim());
        return tokens.includes(keyword.toLowerCase());
      });

      let agreed = false;
      let mainCategories: string[] = [];
      let subcategoryName = keyword;

      if (configMap?.has(keyword)) {
        agreed = true;
        // 找出所有 mainCategory-subcategoryName 組合
        const matchedEntries = Array.from(configMap.entries())
          .filter(([k]) => k === keyword)
          .map(([, v]) => v);

        mainCategories = [...new Set(matchedEntries.map((e) => e.mainCategory))];

        // 只顯示第一個出現的 subcategoryName 作為卡片標題（後續操作仍保留 mainCategories 全部）
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
    //.filter((card) => card.matchedVideos.length > 0 || card.agreed || card.skipped)
    .sort((a, b) => b.matchedVideos.length - a.matchedVideos.length);
}
