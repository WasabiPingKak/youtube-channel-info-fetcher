import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import type {
  Video,
  CategorySettings,
  GameEntry,
} from '../types/editor';

/* ---------- 型別 ---------- */
export interface SuggestedKeyword {
  keyword: string;
  count: number;
}

export interface KeywordSuggestionResult {
  bracketKeywords: SuggestedKeyword[];
  frequentKeywords: SuggestedKeyword[];
  gameKeywords: SuggestedKeyword[];
  rebuild: () => void;
}

/* ---------- 常數 ---------- */
const BRACKET_REGEX = /[\[【](.*?)[\]】]/g;

const tokenize = (text: string): string[] =>
  text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

/* 停用詞清單 */
const STOP_WORDS = new Set<string>(['一個', '這個']);

/* 判斷是否為純數字 */
const isPureNumber = (token: string): boolean => {
  const arabic = /^\d+$/;
  const roman = /^[ivxlcdm]+$/i;
  const chinese = /^[零一二三四五六七八九十百千萬兩]+$/;
  return arabic.test(token) || roman.test(token) || chinese.test(token);
};

/* ---------- Hook 主體 ---------- */
export function useKeywordSuggestion(
  videos: Video[] = [],
  removed: string[] = []
): KeywordSuggestionResult {
  const [bracketKeywords, setBracketKeywords] = useState<SuggestedKeyword[]>([]);
  const [frequentKeywords, setFrequentKeywords] = useState<SuggestedKeyword[]>([]);
  const [gameKeywords, setGameKeywords] = useState<SuggestedKeyword[]>([]);

  const rebuild = useCallback(() => {
    const bracketCounter: Record<string, number> = {};
    const freqCounter: Record<string, number> = {};
    const bracketRawStrings: Set<string> = new Set();

    for (const video of videos) {
      const title = video.title;

      // ✅ 收集括號內原始完整字串（不再做分詞）
      const matches = [...title.matchAll(BRACKET_REGEX)];
      for (const match of matches) {
        const full = match[1].trim();
        if (full.length > 0) {
          bracketRawStrings.add(full);
          bracketCounter[full] = (bracketCounter[full] || 0) + 1;
        }
      }

      // ✅ 分詞頻率統計（frequentKeywords 用）
      const tokens = tokenize(title);
      for (const token of tokens) {
        if (!STOP_WORDS.has(token)) {
          freqCounter[token] = (freqCounter[token] || 0) + 1;
        }
      }
    }

    const filteredFrequent: SuggestedKeyword[] = Object.entries(freqCounter)
      .filter(
        ([word, count]) =>
          count >= 2 &&
          !bracketRawStrings.has(word) &&
          !isPureNumber(word)
      )
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count);

    const bracketList: SuggestedKeyword[] = Object.entries(bracketCounter)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count); // ✅ 不拆字、不排除、保留低頻詞

    setBracketKeywords(bracketList);
    setFrequentKeywords(filteredFrequent);
    setGameKeywords([]); // 遊戲標籤尚未實作
  }, [videos]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  return {
    bracketKeywords,
    frequentKeywords,
    gameKeywords,
    rebuild,
  };
}
