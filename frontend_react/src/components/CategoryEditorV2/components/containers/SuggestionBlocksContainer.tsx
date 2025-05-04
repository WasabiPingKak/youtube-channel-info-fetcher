import React from 'react';
import { useEditorStore } from '../../hooks/useEditorStore';
import { useKeywordSuggestion } from '../../hooks/useKeywordSuggestion';
import BracketKeywordBlock from '../BracketKeywordBlock';
import FrequentKeywordBlock from '../FrequentKeywordBlock';
import GameTagTable from '../GameTagTable';
import CustomTagTable from '../CustomTagTable';
import {
  mapBracketSuggestions,
  mapFrequencySuggestions,
  mapGameSuggestions,
  mapCustomSuggestions,
} from '../../utils/suggestionUtils';

export default function SuggestionBlocksContainer() {
  const videos = useEditorStore((s) => s.videos);
  const removed = useEditorStore((s) => s.removedSuggestedKeywords);
  const config = useEditorStore((s) => s.config);
  const toggleChecked = useEditorStore((s) => s.toggleSuggestionChecked);
  const activeType = useEditorStore((s) => s.activeType);

  const {
    bracketKeywords,
    frequentKeywords,
    gameKeywords,
    rebuild,
  } = useKeywordSuggestion(videos, removed);

  const selectedBracket = useEditorStore((s) => s.selectedBySource.bracket);
  const selectedFrequency = useEditorStore((s) => s.selectedBySource.frequency);
  const selectedGame = useEditorStore((s) => s.selectedBySource.game);
  const customKeywords = useEditorStore((s) => s.customKeywords);
  const selectedCustom = useEditorStore((s) => s.selectedBySource.custom);

  const bracketSuggestions = mapBracketSuggestions(bracketKeywords, selectedBracket);
  const frequencySuggestions = mapFrequencySuggestions(frequentKeywords, selectedFrequency);
  const gameEntries = config?.[activeType]?.遊戲 ?? [];
  const gameSuggestions = mapGameSuggestions(gameEntries, videos, selectedGame);
  const customSuggestions = mapCustomSuggestions(customKeywords, videos, selectedCustom);

  return (
    <section className="space-y-6">
      <BracketKeywordBlock
        keywords={bracketKeywords}
        selected={Array.from(selectedBracket)}
        toggleChecked={(kw) => toggleChecked('bracket', kw)}
      />
      <FrequentKeywordBlock
        keywords={frequentKeywords}
        selected={Array.from(selectedFrequency)}
        toggleChecked={(kw) => toggleChecked('frequency', kw)}
      />
      <GameTagTable />
      <CustomTagTable />
    </section>
  );
}
