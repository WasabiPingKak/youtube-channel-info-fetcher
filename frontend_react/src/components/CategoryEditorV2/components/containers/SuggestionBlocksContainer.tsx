import React from 'react';
import { useEditorStore } from '../../hooks/useEditorStore';
import { useKeywordSuggestion } from '../../hooks/useKeywordSuggestion';
import BracketKeywordBlock from '../BracketKeywordBlock';
import FrequentKeywordBlock from '../FrequentKeywordBlock';
import GameTagTable from '../GameTagTable';
import CustomTagTable from '../CustomTagTable';
import {
  mapGameSuggestions,
  mapCustomSuggestions,
} from '../../utils/suggestionUtils';

export default function SuggestionBlocksContainer() {
  const videos = useEditorStore((s) => s.videos);
  const removed = useEditorStore((s) => s.removedSuggestedKeywords);
  const config = useEditorStore((s) => s.config);
  const toggleChecked = useEditorStore((s) => s.toggleSuggestionChecked);
  const activeType = useEditorStore((s) => s.activeType);

  // 原始建議列表
  const {
    bracketKeywords,
    frequentKeywords,
  } = useKeywordSuggestion(videos, removed);

  // 已選中的名稱集合
  const selectedBracket = useEditorStore((s) => s.selectedBySource.bracket);
  const selectedFrequency = useEditorStore((s) => s.selectedBySource.frequency);
  const selectedGame = useEditorStore((s) => s.selectedBySource.game);
  const customKeywords = useEditorStore((s) => s.customKeywords);
  const selectedCustom = useEditorStore((s) => s.selectedBySource.custom);

  // 產生遊戲與自訂關鍵字的建議模型
  const gameEntries = config?.[activeType]?.遊戲 ?? [];
  const gameSuggestions = mapGameSuggestions(gameEntries, videos, selectedGame);
  const customSuggestions = mapCustomSuggestions(customKeywords, videos, selectedCustom);

  // 要隱藏的關鍵字名稱集合
  const excludeNames = new Set<string>([
    ...gameSuggestions.map((s) => s.name),
    ...customSuggestions.map((s) => s.name),
  ]);

  // 過濾掉所有出現在遊戲或自訂區塊的關鍵字
  const filteredBracket = bracketKeywords.filter((kw) => !excludeNames.has(kw.keyword));
  const filteredFrequent = frequentKeywords.filter((kw) => !excludeNames.has(kw.keyword));

  return (
    <section className="space-y-6">
      <BracketKeywordBlock
        keywords={filteredBracket}
        selected={selectedBracket}
        toggleChecked={(kw) => toggleChecked('bracket', kw)}
      />
      <FrequentKeywordBlock
        keywords={filteredFrequent}
        selected={Array.from(selectedFrequency)}
        toggleChecked={(kw) => toggleChecked('frequency', kw)}
      />
      <GameTagTable />
      <CustomTagTable />
    </section>
  );
}
