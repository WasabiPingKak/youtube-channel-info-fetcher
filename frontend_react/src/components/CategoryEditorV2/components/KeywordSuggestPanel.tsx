import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { useKeywordSuggestion } from '../hooks/useKeywordSuggestion';
import SelectedCategoryPills from './common/SelectedCategoryPills';
import { useCategoryFilterState } from '../hooks/useCategoryFilterState';
import {
  mapBracketSuggestions,
  mapFrequencySuggestions,
  mapGameSuggestions,
  mapCustomSuggestions,
  extractCategoryNames,
  mergeSuggestionsByPriority,
} from '../utils/suggestionUtils';
import SuggestionBlocksContainer from './containers/SuggestionBlocksContainer';
import SelectedFilterPanel from './containers/SelectedFilterPanel';

export default function KeywordSuggestPanel() {
  const videos = useEditorStore((s) => s.videos);
  const removed = useEditorStore((s) => s.removedSuggestedKeywords);
  const config = useEditorStore((s) => s.config);
  const toggleChecked = useEditorStore((s) => s.toggleSuggestionChecked);
  const activeType = useEditorStore((s) => s.activeType);
  const initCustomKeywords = useEditorStore(
    (s) => s.initCustomKeywordsFromConfig,
  );

  const {
    bracketKeywords,
    frequentKeywords,
    gameKeywords,
    rebuild,
  } = useKeywordSuggestion(videos, removed);

  /* ---------- store 選取狀態 ---------- */
  const selectedBracket = useEditorStore((s) => s.selectedBySource.bracket);
  const selectedFrequency = useEditorStore((s) => s.selectedBySource.frequency);
  const selectedGame = useEditorStore((s) => s.selectedBySource.game);

  /* ---------- ✍️ 自訂關鍵字 ---------- */
  const customKeywords = useEditorStore((s) => s.customKeywords);
  const selectedCustom = useEditorStore((s) => s.selectedBySource.custom);

  /* ---------- Pill 用 suggestions ---------- */
  const bracketSuggestions = mapBracketSuggestions(bracketKeywords, selectedBracket);
  const frequencySuggestions = mapFrequencySuggestions(frequentKeywords, selectedFrequency);

  const gameEntries = config?.[activeType]?.遊戲 ?? [];
  const gameSuggestions = mapGameSuggestions(gameEntries, videos, selectedGame);
  const customSuggestions = mapCustomSuggestions(customKeywords, videos, selectedCustom);

  // 合併同名關鍵字，依來源優先級去重
  const allSuggestions = mergeSuggestionsByPriority([
    ...gameSuggestions,
    ...customSuggestions,
    ...bracketSuggestions,
    ...frequencySuggestions,
  ]);

  /* ---------- 關鍵字過濾狀態 ---------- */
  const { selectedFilter, setFilter, clearFilter, isFilterActive } =
    useCategoryFilterState();

  /* ---------- ✅ 自訂關鍵字初始化 ---------- */
  const hasInitRef = useRef(false);

  useEffect(() => {
    if (hasInitRef.current) return;
    if (!config || videos.length === 0) return;
    if (bracketKeywords.length === 0 && frequentKeywords.length === 0) return;

    hasInitRef.current = true;

    const configNames = extractCategoryNames(config);

    bracketKeywords.forEach((item) => {
      if (configNames.has(item.keyword)) {
        toggleChecked('bracket', item.keyword, true);
      }
    });

    frequentKeywords.forEach((item) => {
      if (configNames.has(item.keyword)) {
        toggleChecked('frequency', item.keyword, true);
      }
    });

    gameEntries.forEach((entry) => {
      if (configNames.has(entry.game)) {
        toggleChecked('game', entry.game, true);
      }
    });

    initCustomKeywords(
      config[activeType] ?? {},
      bracketKeywords.map((k) => k.keyword),
      frequentKeywords.map((k) => k.keyword),
      gameEntries,
    );
  }, [config, videos, bracketKeywords, frequentKeywords, gameEntries]);

  /* ---------- Render ---------- */
  return (
    <div className="p-3 border rounded-xl space-y-6 bg-white shadow">
      {/* ❶ 自動來源 + 自訂關鍵字區塊 */}
      <SuggestionBlocksContainer />

      {/* ❷ 已勾選 pills */}
      <SelectedFilterPanel suggestions={allSuggestions} />
    </div>
  );
}
