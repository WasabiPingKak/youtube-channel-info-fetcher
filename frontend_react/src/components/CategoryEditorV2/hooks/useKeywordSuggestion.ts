import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from './useEditorStore';
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

/* 可擴充停用詞 */
const STOP_WORDS = new Set<string>(['一個', '這個']);

/**
 * 預設空的分類設定，用於避免每次回傳新物件導致快取失效
 */
const DEFAULT_CATEGORY_SETTINGS: CategorySettings = {};

/* ---------- Hook 主體 ---------- */
export function useKeywordSuggestion(
  videos: Video[] = [],
  removed: string[] = []
): KeywordSuggestionResult {
  const [bracketKeywords, setBracketKeywords] = useState<SuggestedKeyword[]>([]);
  const [frequentKeywords, setFrequentKeywords] = useState<SuggestedKeyword[]>([]);
  const [gameKeywords, setGameKeywords] = useState<SuggestedKeyword[]>([]);

  /* 直接從全域 store 取得目前影片型別與設定 */
  const activeType = useEditorStore((s) => s.activeType);
  const rawCategorySettings = useEditorStore(
    (s) => s.config?.[activeType] as CategorySettings | undefined
  );
  const categorySettings = rawCategorySettings ?? DEFAULT_CATEGORY_SETTINGS;

  const rebuild = useCallback(() => {
    /* ---- 統計器 ---- */
    const bracketCounter: Record<string, number> = {};
    const keywordCounter: Record<string, number> = {};
    const gameCounter: Record<string, number> = {};

    const usedInBracket = new Set<string>(); // 記錄已命中括號的 videoId

    /* ---------- 📎 解析括號詞 ---------- */
    for (const video of videos) {
      const title = video.title ?? '';
      let match: RegExpExecArray | null;
      BRACKET_REGEX.lastIndex = 0; // reset

      while ((match = BRACKET_REGEX.exec(title)) !== null) {
        const kw = match[1].trim();
        if (!kw || removed.includes(kw)) continue;

        bracketCounter[kw] = (bracketCounter[kw] || 0) + 1;
        usedInBracket.add(video.videoId);
      }
    }

    /* ---------- 🔍 高頻關鍵字 ---------- */
    for (const video of videos) {
      if (usedInBracket.has(video.videoId)) continue;

      const tokens = tokenize(video.title ?? '');

      for (const tk of tokens) {
        if (STOP_WORDS.has(tk) || removed.includes(tk)) continue;
        keywordCounter[tk] = (keywordCounter[tk] || 0) + 1;
      }
    }

    /* ---------- 🎮 遊戲關鍵字 ---------- */
    const gameEntries: GameEntry[] = categorySettings.遊戲 ?? [];

    for (const video of videos) {
      const titleLower = (video.title ?? '').toLowerCase();

      for (const game of gameEntries) {
        for (const kw of game.keywords) {
          if (removed.includes(kw)) continue;
          if (titleLower.includes(kw.toLowerCase())) {
            gameCounter[kw] = (gameCounter[kw] || 0) + 1;
          }
        }
      }
    }

    /* ---------- 產生結果 ---------- */
    const bracketList = Object.entries(bracketCounter)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    const frequentList = Object.entries(keywordCounter)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    const gameList = Object.entries(gameCounter)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    setBracketKeywords(bracketList);
    setFrequentKeywords(frequentList);
    setGameKeywords(gameList);
  }, [videos, removed, rawCategorySettings]);

  /* 首次掛載 & 依賴變動時重建 */
  useEffect(() => {
    rebuild();
  }, [rebuild]);

  return { bracketKeywords, frequentKeywords, gameKeywords, rebuild };
}
