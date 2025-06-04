import { useCallback, useEffect, useState } from 'react';
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
  const [suggestions, setSuggestions] = useState<SuggestedKeyword[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [rebuildTrigger, setRebuildTrigger] = useState<number>(0);

  const rebuild = useCallback(() => {
    setRebuildTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    setLoading(true);

    const keywordMap: Map<string, Set<string>> = new Map();

    const unclassifiedVideos = videos.filter(
      (v) => v.matchedCategories?.length === 1 && v.matchedCategories[0] === '未分類'
    );

    for (const video of unclassifiedVideos) {
      const videoId = video.videoId;
      const rawTitle = video.title;

      // Step 1: 括號片語
      const phrases = extractBracketPhrases(rawTitle);
      for (const phrase of phrases) {
        if (!keywordMap.has(phrase)) keywordMap.set(phrase, new Set());
        keywordMap.get(phrase)!.add(videoId);
      }

      // Step 2: 拆解後文字
      const titleWithoutPhrases = rawTitle.replace(/[\[\(【（](.*?)[\]\)】）]/g, ' ');
      const tokens = normalize(titleWithoutPhrases)
        .split(' ')
        .map((t) => t.trim())
        .filter((word) => {
          if (word.length < 2) return false;
          if (STOP_WORDS.has(word)) return false;
          if (isSerialPattern(word)) return false;
          return true;
        });

      for (const token of tokens) {
        if (!keywordMap.has(token)) keywordMap.set(token, new Set());
        keywordMap.get(token)!.add(videoId);
      }
    }

    const mergedSuggestions: SuggestedKeyword[] = Array.from(keywordMap.entries())
      .filter(([, set]) => set.size >= 2)
      .map(([keyword, set]) => ({
        keyword,
        count: set.size,
      }))
      .sort((a, b) => b.count - a.count);

    console.log('[KeywordHook] mergedSuggestions', mergedSuggestions);
    setSuggestions(mergedSuggestions);
    setLoading(false);
  }, [videos, rebuildTrigger]);

  return {
    suggestions,
    loading,
    rebuild,
  };
}
