import type { Video, GameEntry } from '../types/editor';

export interface Suggestion {
  name: string;
  source: 'bracket' | 'frequency' | 'game' | 'custom';
  matchedCount: number;
  isChecked: boolean;
}

/**
 * 產生括號關鍵字的建議項目
 */
export function mapBracketSuggestions(
  bracketKeywords: { keyword: string; count: number }[],
  selectedBracket: Set<string>,
): Suggestion[] {
  return bracketKeywords.map(item => ({
    name: item.keyword,
    source: 'bracket',
    matchedCount: item.count,
    isChecked: selectedBracket.has(item.keyword),
  }));
}

/**
 * 產生高頻關鍵字的建議項目
 */
export function mapFrequencySuggestions(
  frequentKeywords: { keyword: string; count: number }[],
  selectedFrequency: Set<string>,
): Suggestion[] {
  return frequentKeywords.map(item => ({
    name: item.keyword,
    source: 'frequency',
    matchedCount: item.count,
    isChecked: selectedFrequency.has(item.keyword),
  }));
}

/**
 * 產生遊戲標籤的建議項目
 */
export function mapGameSuggestions(
  gameEntries: GameEntry[],
  videos: Video[],
  selectedGame: Set<string>,
): Suggestion[] {
  return gameEntries.map(g => {
    const keywords = [...(g.keywords ?? []), g.game];
    const matchedCount = videos.filter(v =>
      keywords.some(kw =>
        v.title.toLowerCase().includes(kw.toLowerCase()),
      ),
    ).length;
    return {
      name: g.game,
      source: 'game',
      matchedCount,
      isChecked: selectedGame.has(g.game),
    };
  });
}

/**
 * 產生自訂關鍵字的建議項目
 */
export function mapCustomSuggestions(
  customKeywords: string[],
  videos: Video[],
  selectedCustom: Set<string>,
): Suggestion[] {
  return customKeywords.map(kw => {
    const matchedCount = videos.filter(v =>
      v.title.toLowerCase().includes(kw.toLowerCase()),
    ).length;
    return {
      name: kw,
      source: 'custom',
      matchedCount,
      isChecked: selectedCustom.has(kw),
    };
  });
}

/**
 * 從 config 物件中擷取所有分類名稱 (含字串 & 遊戲名稱)
 */
export function extractCategoryNames(
  config: {
    live?: Record<string, any>;
    videos?: Record<string, any>;
    shorts?: Record<string, any>;
  }
): Set<string> {
  const result = new Set<string>();
  (['live', 'videos', 'shorts'] as const).forEach(type => {
    const block = config[type];
    if (!block) return;
    Object.values(block).forEach(entries => {
      if (Array.isArray(entries) && entries.length > 0) {
        if (typeof entries[0] === 'string') {
          (entries as string[]).forEach(name => result.add(name));
        } else if (
          typeof entries[0] === 'object' &&
          entries[0] !== null
        ) {
          (entries as { game: string }[]).forEach(g => result.add(g.game));
        }
      }
    });
  });
  return result;
}
