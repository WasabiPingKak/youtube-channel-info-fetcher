// components/common/SelectedCategoryPills.tsx
// ------------------------------------------------------------------
// 關鍵字 Pill 清單
// 2025‑05‑05 update:
//   • 點擊 pill 時同步更新 useEditorStore.activeKeywordFilter
//   • 如果再次點擊同 keyword → 清空 activeKeywordFilter (切換 off)
//   • 預設 isActive 若外層未提供，改用 store 的 activeKeywordFilter
// ------------------------------------------------------------------

import React from 'react';
import { useEditorStore } from '../../hooks/useEditorStore';

/* ---------- 型別 ---------- */
export type CategorySource = 'bracket' | 'frequency' | 'game' | 'custom';

interface CategorySuggestion {
  name: string;
  source: CategorySource;
  matchedCount: number;
  isChecked: boolean;
}

export interface SelectedFilter {
  type: CategorySource;
  name: string;
}

interface SelectedCategoryPillsProps {
  suggestions: CategorySuggestion[];
  onFilterClick?: (filter: SelectedFilter) => void;
  /**
   * 外層自定義判斷活躍狀態；若未傳，預設以 store.activeKeywordFilter === filter.name
   */
  isActive?: (filter: SelectedFilter) => boolean;
}

const sourceLabels: Record<CategorySource, string> = {
  bracket: '📎 標題解析',
  frequency: '📊 高頻詞解析',
  game: '🎮 遊戲標籤',
  custom: '✍️ 自訂關鍵字',
};

export default function SelectedCategoryPills({
  suggestions,
  onFilterClick,
  isActive,
}: SelectedCategoryPillsProps) {
  /* ---------- Store hooks ---------- */
  const activeKeyword = useEditorStore((s) => s.activeKeywordFilter);
  const setActiveKeyword = useEditorStore((s) => s.setActiveKeywordFilter);

  /* ---------- 分組 ---------- */
  const grouped: Record<CategorySource, CategorySuggestion[]> = {
    bracket: [],
    frequency: [],
    game: [],
    custom: [],
  };

  suggestions
    .filter((s) => s.isChecked)
    .forEach((item) => {
      grouped[item.source].push(item);
    });

  /* ---------- Render ---------- */
  return (
    <section className="p-4 rounded-md bg-white space-y-4">
      {(['bracket', 'frequency', 'game', 'custom'] as CategorySource[]).map(
        (source) => {
          const items = grouped[source];
          if (!items || items.length === 0) return null;

          return (
            <div key={source}>
              <h4 className="font-semibold mb-2">{sourceLabels[source]}</h4>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const filter: SelectedFilter = {
                    type: item.source,
                    name: item.name,
                  };

                  const active =
                    isActive?.(filter) ?? activeKeyword === item.name;

                  const baseStyle =
                    'rounded-full text-sm px-4 py-1 border transition';
                  const activeStyle = 'bg-gray-800 text-white';
                  const inactiveStyle =
                    'bg-gray-100 text-gray-800 hover:bg-gray-200';

                  /* 點擊事件：
                     ‑ 更新 store.activeKeywordFilter
                     ‑ 回呼外層 onFilterClick（保持向下相容）
                  */
                  const handleClick = () => {
                    // 切換邏輯：同 keyword 再點一次則關閉
                    if (active) {
                      setActiveKeyword(null);
                    } else {
                      setActiveKeyword(item.name);
                    }

                    onFilterClick?.(filter);
                  };

                  return (
                    <button
                      key={item.name + item.source}
                      className={`${baseStyle} ${
                        active ? activeStyle : inactiveStyle
                      }`}
                      onClick={handleClick}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        },
      )}
    </section>
  );
}
