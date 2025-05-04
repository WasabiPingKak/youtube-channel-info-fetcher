import React, { useEffect } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { useKeywordSuggestion } from '../hooks/useKeywordSuggestion';
import BracketKeywordBlock from './BracketKeywordBlock';
import FrequentKeywordBlock from './FrequentKeywordBlock';
import GameTagTable from './GameTagTable';
import SelectedCategoryPills from './common/SelectedCategoryPills';
import CustomTagTable from './CustomTagTable';
import { useCategoryFilterState } from '../hooks/useCategoryFilterState';

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
  const gameSuggestions = gameEntries.map((g) => {
    const keywords = [...(g.keywords || []), g.game];
    const matchedCount = videos.filter((v) =>
      keywords.some((kw) => v.title.toLowerCase().includes(kw.toLowerCase())),
    ).length;

    return {
      name: g.game,
      source: 'game' as const,
      matchedCount,
      isChecked: selectedGame.has(g.game),
    };
  });

  const customSuggestions = customKeywords.map((kw) => {
    const matchedCount = videos.filter((v) =>
      v.title.toLowerCase().includes(kw.toLowerCase()),
    ).length;

    return {
      name: kw,
      source: 'custom' as const,
      matchedCount,
      isChecked: selectedCustom.has(kw),
    };
  });

  const allSuggestions = [
    ...bracketSuggestions,
    ...frequencySuggestions,
    ...gameSuggestions,
    ...customSuggestions,
  ];

  /* ---------- 關鍵字過濾狀態 ---------- */
  const { selectedFilter, setFilter, clearFilter, isFilterActive } =
    useCategoryFilterState();

  /* ---------- 初始化勾選 ---------- */
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

    // ✅ 新增：初始化自訂關鍵字
    initCustomKeywords(
      config?.[activeType] ?? {},
      bracketKeywords.map((k) => k.keyword),
      frequentKeywords.map((k) => k.keyword),
      gameEntries,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, activeType, bracketKeywords, frequentKeywords, gameEntries]);

  /* ---------- Render ---------- */
  return (
    <div className="p-3 border rounded-xl space-y-6 bg-white shadow">
      {/* ❶ 自動來源 + 自訂關鍵字區塊 */}
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

      {/* ❷ 已勾選 pills */}
      <section className="mt-6 p-4 border rounded-xl bg-gray-50">
        <header className="mb-2">
          <h3 className="font-semibold mb-1">🧩 關鍵字過濾區</h3>
          <p className="text-sm text-gray-500">
            這些是你已勾選的分類標籤，儲存後將套用到目前影片類型。
          </p>
        </header>

        <SelectedCategoryPills
          suggestions={allSuggestions}
          onFilterClick={(filter) =>
            isFilterActive(filter) ? clearFilter() : setFilter(filter)
          }
          isActive={isFilterActive}
        />

        <div className="mt-4">
          <button
            className="text-sm px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            onClick={clearFilter}
          >
            顯示所有影片
          </button>
        </div>
      </section>
    </div>
  );
}
