import React, { useEffect } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { useKeywordSuggestion } from '../hooks/useKeywordSuggestion';
import BracketKeywordBlock from './BracketKeywordBlock';
import FrequentKeywordBlock from './FrequentKeywordBlock';
import GameTagTable from './GameTagTable';
import SelectedCategoryPills from './common/SelectedCategoryPills';
import CustomKeywordBlock from './CustomKeywordBlock';

export default function KeywordSuggestPanel() {
  const videos = useEditorStore((s) => s.videos);
  const removed = useEditorStore((s) => s.removedSuggestedKeywords);
  const addRemovedKeyword = useEditorStore((s) => s.addRemovedKeyword);
  const addKeywordToCategory = useEditorStore((s) => s.addKeywordToCategory);
  const setUnsaved = useEditorStore((s) => s.setUnsaved);
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

  const bracketSuggestions = bracketKeywords.map((item) => ({
    name: item.keyword,
    source: 'bracket' as const,
    matchedCount: item.count,
    isChecked: selectedBracket.has(item.keyword),
  }));

  const frequencySuggestions = frequentKeywords.map((item) => ({
    name: item.keyword,
    source: 'frequency' as const,
    matchedCount: item.count,
    isChecked: selectedFrequency.has(item.keyword),
  }));

  const gameEntries = config?.[activeType]?.遊戲 ?? [];

  // ✅ Log for debugging
  console.log('🔍 activeType:', activeType);
  console.log('🎮 config[activeType]?.遊戲:', config?.[activeType]?.遊戲);
  console.log('📺 videos (sample):', videos.slice(0, 3).map((v) => v.title));

  const gameSuggestions = gameEntries.map((g) => {
    const keywords = [...(g.keywords || []), g.game]; // ✅ 加入 game 名稱作為 fallback keyword
    const matchedCount = videos.filter((v) =>
      keywords.some((kw) =>
        v.title.toLowerCase().includes(kw.toLowerCase())
      )
    ).length;

    return {
      name: g.game,
      source: 'game' as const,
      matchedCount,
      isChecked: selectedGame.has(g.game),
    };
  });

  const allSuggestions = [
    ...bracketSuggestions,
    ...frequencySuggestions,
    ...gameSuggestions,
  ];

  function extractCategoryNames(config: any): Set<string> {
    const result = new Set<string>();
    ['live', 'videos', 'shorts'].forEach((type) => {
      const block = config[type];
      if (!block) return;
      Object.values(block).forEach((entries) => {
        if (Array.isArray(entries)) {
          if (entries.length > 0 && typeof entries[0] === 'string') {
            (entries as string[]).forEach((name) => result.add(name));
          } else if (entries.length > 0 && typeof entries[0] === 'object') {
            (entries as { game: string }[]).forEach((g) => result.add(g.game));
          }
        }
      });
    });
    return result;
  }

  // ✅ 預設勾選出現在 config 中的分類名稱
  useEffect(() => {
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
  }, [bracketKeywords, frequentKeywords, gameEntries, config, toggleChecked]);

  return (
    <div className="p-3 border rounded-xl space-y-6 bg-white shadow">
      <BracketKeywordBlock
        keywords={bracketKeywords.map(item => ({ keyword: item.keyword, count: item.count }))}
        selected={Array.from(selectedBracket)}
        toggleChecked={(kw) => toggleChecked('bracket', kw)}
      />
      <FrequentKeywordBlock
        keywords={frequentKeywords.map(item => ({ keyword: item.keyword, count: item.count }))}
        selected={Array.from(selectedFrequency)}
        toggleChecked={(kw) => toggleChecked('frequency', kw)}
      />
      <GameTagTable />
      <CustomKeywordBlock />

      <section className="bg-white rounded-lg p-4 shadow-sm">
        <header className="mb-2">
          <h3 className="font-semibold mb-1">🧩 編輯中的分類標籤</h3>
          <p className="text-sm text-gray-500">
            這些是你已勾選的分類標籤，儲存後將套用到目前影片類型。
          </p>
        </header>
        <SelectedCategoryPills
          suggestions={allSuggestions}
          onFilterClick={(name) => {
            console.log("Filter clicked:", name);
          }}
        />
      </section>
    </div>
  );
}
