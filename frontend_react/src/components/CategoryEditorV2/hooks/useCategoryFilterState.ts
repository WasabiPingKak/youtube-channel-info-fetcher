import { create } from 'zustand';

export type CategorySource = 'bracket' | 'frequency' | 'game' | 'custom';

export interface SelectedFilter {
  type: CategorySource;
  name: string;
}

interface FilterState {
  selectedFilter: SelectedFilter | null;
  setFilter: (filter: SelectedFilter) => void;
  clearFilter: () => void;
  isFilterActive: (filter: SelectedFilter) => boolean;
}

export const useCategoryFilterState = create<FilterState>((set, get) => ({
  selectedFilter: null,
  setFilter: (filter) => set({ selectedFilter: filter }),
  clearFilter: () => set({ selectedFilter: null }),
  isFilterActive: (filter) => {
    const current = get().selectedFilter;
    return (
      current?.name === filter.name &&
      current?.type === filter.type
    );
  },
}));
