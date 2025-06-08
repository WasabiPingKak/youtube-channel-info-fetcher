import { useCallback, useMemo, useState } from 'react';
import type { ClassifiedVideoItem } from './useClassifiedVideos';
import {
  normalize,
  STOP_WORDS,
  isSerialPattern,
  extractBracketPhrases,
} from '@/utils/textUtils';

export interface SuggestedKeyword {
  keyword: string;
  count: number;
}

interface KeywordSuggestionResult {
  suggestions: SuggestedKeyword[];
  loading: boolean;
  rebuild: () => void;
}

export function useFrequentKeywordSuggestions(
  videos: ClassifiedVideoItem[]
): KeywordSuggestionResult {
  // 1. 當前針對「強制重新計算」用的 trigger
  const [rebuildTrigger, setRebuildTrigger] = useState<number>(0);
  const rebuild = useCallback(() => {
    setRebuildTrigger((prev) => prev + 1);
  }, []);

  // 2. useMemo 會在 videos 或 rebuildTrigger 變動時，重新執行以下計算
  const suggestions = useMemo<SuggestedKeyword[]>(() => {
    // 如果 videos 還是空陣列，直接回傳空、並且不做任何計算
    if (!videos || videos.length === 0) {
      return [];
    }

    // Step A: 先把「只屬於 '未分類'」的影片挑出來
    // 這段邏輯和原本 effect 中的 filter 是一樣的
    const unclassifiedVideos = videos.filter(
      (v) => v.matchedCategories?.length === 1 && v.matchedCategories[0] === '未分類'
    );

    // Step B: 用一個 Map<string, Set<string>> 來累計每個關鍵字對應到哪些 videoId
    const keywordMap: Map<string, Set<string>> = new Map();

    for (const video of unclassifiedVideos) {
      const videoId = video.videoId;
      const rawTitle = video.title;

      // (1) 括號片語
      const phrases = extractBracketPhrases(rawTitle);
      for (const phrase of phrases) {
        if (!keywordMap.has(phrase)) {
          keywordMap.set(phrase, new Set());
        }
        keywordMap.get(phrase)!.add(videoId);
      }

      // (2) 拆解剩下的文字，分詞、過濾停用詞/序號字串，再累計
      const titleWithoutPhrases = rawTitle.replace(/[\[\(【（](.*?)[\]\)】）]/g, ' ');
      const tokens = normalize(titleWithoutPhrases)
        .split(' ')
        .map((t) => t.trim())
        .filter((word) => {
          // 長度至少 2 個字
          if (word.length < 2) return false;
          // 不能是停用詞
          if (STOP_WORDS.has(word)) return false;
          // 不能是序號模式（如 "001", "1234" 這種）
          if (isSerialPattern(word)) return false;
          return true;
        });

      for (const token of tokens) {
        if (!keywordMap.has(token)) {
          keywordMap.set(token, new Set());
        }
        keywordMap.get(token)!.add(videoId);
      }
    }

    // Step C: 把累計好的 Map 轉成陣列，再過濾「至少命中 2 部影片才算建議」
    const merged: SuggestedKeyword[] = Array.from(keywordMap.entries())
      .filter(([, set]) => set.size >= 2) // 只保留「至少在 2 支影片中命中」的關鍵字
      .map(([keyword, set]) => ({
        keyword,
        count: set.size, // count = 命中影片的數量
      }))
      // Step D: 排序：先按照 count（降冪），如果一樣就按 keyword 的字母順序排序
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.keyword.localeCompare(b.keyword);
      });

    console.log('[KeywordHook] mergedSuggestions (useMemo)', merged);
    return merged;
  }, [videos, rebuildTrigger]);

  // 由於 useMemo 是同步計算，一旦 videos 傳進來、計算完就能拿到結果
  // 因此我們不需要再用 setTimeout/第二個 useEffect 才把 loading 關掉
  // 只要直接宣告：只要 videos 已有值，就把 loading 視為 false
  const loading = false;

  return {
    suggestions,
    loading,
    rebuild,
  };
}
