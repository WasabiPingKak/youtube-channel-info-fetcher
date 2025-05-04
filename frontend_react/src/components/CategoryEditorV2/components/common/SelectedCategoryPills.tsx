import React from "react";

type CategorySource = "bracket" | "frequency" | "game" | "custom";

interface CategorySuggestion {
  name: string;
  source: CategorySource;
  matchedCount: number;
  isChecked: boolean;
}

interface SelectedFilter {
  type: CategorySource;
  name: string;
}

interface SelectedCategoryPillsProps {
  suggestions: CategorySuggestion[];
  onFilterClick?: (filter: SelectedFilter) => void;
  isActive?: (filter: SelectedFilter) => boolean;
}

const sourceLabels: Record<CategorySource, string> = {
  bracket: "📎 標題解析",
  frequency: "📊 高頻詞解析",
  game: "🎮 遊戲標籤",
  custom: "✍️ 自訂關鍵字",
};

export default function SelectedCategoryPills({
  suggestions,
  onFilterClick,
  isActive,
}: SelectedCategoryPillsProps) {
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

  return (
    <section className="p-4 rounded-md bg-white space-y-4">
      {(["bracket", "frequency", "game", "custom"] as CategorySource[]).map(
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

                  const active = isActive?.(filter) ?? false;
                  const baseStyle =
                    "rounded-full text-sm px-4 py-1 border transition";
                  const activeStyle = "bg-gray-800 text-white";
                  const inactiveStyle =
                    "bg-gray-100 text-gray-800 hover:bg-gray-200";

                  return (
                    <button
                      key={item.name + item.source}
                      className={`${baseStyle} ${
                        active ? activeStyle : inactiveStyle
                      }`}
                      onClick={() => onFilterClick?.(filter)}
                    >
                      {item.name} ({item.matchedCount})
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
      )}
    </section>
  );
}
