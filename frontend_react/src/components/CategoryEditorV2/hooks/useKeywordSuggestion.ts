// hooks/useKeywordSuggestion.ts
import { useEffect, useState, useCallback } from 'react';
import type { Video } from '../types/editor';

interface SuggestedKeyword {
  keyword: string;
  count: number;
}

interface KeywordSuggestionResult {
  bracketKeywords: SuggestedKeyword[];
  frequentKeywords: SuggestedKeyword[];
  rebuild: () => void;
}

const BRACKET_REGEX = /[\[\【](.*?)[\]\】]/g;

// 中文助詞、常見無意義詞彙（可擴充）
const STOP_WORDS = new Set(['的', '了', '是', '在', '我', '有', '和', '也', '就', '不', '嗎', '啊']);

export function useKeywordSuggestion(
  videos: Video[],
  removed: string[]
): KeywordSuggestionResult {
  const [bracketKeywords, setBracketKeywords] = useState<SuggestedKeyword[]>([]);
  const [frequentKeywords, setFrequentKeywords] = useState<SuggestedKeyword[]>([]);

  const rebuild = useCallback(() => {
    const bracketCounter: Record<string, number> = {};
    const keywordCounter: Record<string, number> = {};

    const usedInBracket = new Set<string>();
    const tokenizer = (text: string) =>
      text
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));

    for (const video of videos) {
      const title = video.title ?? '';

      // 提取括號詞
      const bracketMatches = [...title.matchAll(BRACKET_REGEX)];
      if (bracketMatches.length > 0) {
        for (const match of bracketMatches) {
          const kw = match[1].trim();
          if (kw && !removed.includes(kw)) {
            bracketCounter[kw] = (bracketCounter[kw] || 0) + 1;
            usedInBracket.add(video.videoId);
          }
        }
      }
    }

    // 統計高頻詞（排除已命中括號的影片）
    for (const video of videos) {
      if (usedInBracket.has(video.videoId)) continue;

      const title = video.title ?? '';
      const tokens = tokenizer(title);

      for (const word of tokens) {
        if (!removed.includes(word)) {
          keywordCounter[word] = (keywordCounter[word] || 0) + 1;
        }
      }
    }

    // 排序與過濾
    const bracketList = Object.entries(bracketCounter)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    const keywordList = Object.entries(keywordCounter)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    setBracketKeywords(bracketList);
    setFrequentKeywords(keywordList);
  }, [videos, removed]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  return { bracketKeywords, frequentKeywords, rebuild };
}
