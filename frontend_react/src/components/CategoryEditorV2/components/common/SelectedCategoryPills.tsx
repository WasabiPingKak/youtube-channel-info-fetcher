import React from "react";

type CategorySource = "bracket" | "frequency" | "game";

interface CategorySuggestion {
  name: string;
  source: CategorySource;
  matchedCount: number;
  isChecked: boolean;
}

interface SelectedCategoryPillsProps {
  suggestions: CategorySuggestion[];
  onFilterClick?: (name: string) => void;
}

const sourceLabels: Record<CategorySource, string> = {
  bracket: "📎 標題解析",
  frequency: "📊 高頻詞解析",
  game: "🎮 遊戲標籤",
};

export default function SelectedCategoryPills({
  suggestions,
  onFilterClick,
}: SelectedCategoryPillsProps) {
  const grouped: Record<CategorySource, CategorySuggestion[]> = {
    bracket: [],
    frequency: [],
    game: [],
  };

  suggestions
    .filter((s) => s.isChecked)
    .forEach((item) => {
      grouped[item.source].push(item);
    });

  return (
    <section className="p-4 rounded-md bg-white space-y-4">
      {(["bracket", "frequency", "game"] as CategorySource[]).map((source) => {
        const items = grouped[source];
        if (!items || items.length === 0) return null;

        return (
          <div key={source}>
            <h4 className="font-semibold mb-2">{sourceLabels[source]}</h4>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <button
                  key={item.name + item.source}
                  className="rounded-full bg-green-600 text-white text-sm px-4 py-1 hover:bg-green-700 transition"
                  onClick={() => onFilterClick?.(item.name)}
                >
                  {item.name} ({item.matchedCount})
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
