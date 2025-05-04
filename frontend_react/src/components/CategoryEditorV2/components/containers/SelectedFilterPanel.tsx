import React from 'react';
import SelectedCategoryPills from '../common/SelectedCategoryPills';
import { useCategoryFilterState } from '../../hooks/useCategoryFilterState';
import type { Suggestion } from '../../utils/suggestionUtils';

interface SelectedFilterPanelProps {
  suggestions: Suggestion[];
}

export default function SelectedFilterPanel({ suggestions }: SelectedFilterPanelProps) {
  const { selectedFilter, setFilter, clearFilter, isFilterActive } = useCategoryFilterState();

  return (
    <section className="mt-6 p-4 border rounded-xl bg-gray-50">
      <header className="mb-2">
        <h3 className="font-semibold mb-1">🧩 關鍵字過濾區</h3>
        <p className="text-sm text-gray-500">
          這些是你已勾選的分類標籤，儲存後將套用到目前影片類型。
        </p>
      </header>

      <SelectedCategoryPills
        suggestions={suggestions}
        onFilterClick={(filter) => {
          if (isFilterActive(filter)) {
            clearFilter();
          } else {
            setFilter(filter);
          }
        }}
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
  );
}
