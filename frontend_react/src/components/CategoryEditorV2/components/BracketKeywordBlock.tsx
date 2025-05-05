import React from "react";
import CategoryToggleButton from "./common/CategoryToggleButton";

interface KeywordBlockProps {
  keywords: { keyword: string; count: number }[];
  selected: string[];
  toggleChecked: (keyword: string) => void;
}

const BracketKeywordBlock: React.FC<KeywordBlockProps> = ({
  keywords,
  selected,
  toggleChecked,
}) => {
  const sortedKeywords = [...keywords].sort((a, b) => b.count - a.count);

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm">
      <header className="mb-2">
        <h3 className="font-semibold mb-1">📎 標題括號解析</h3>
        <p className="text-sm text-gray-500">
          從影片標題的括號中抽取的主題，點擊可在關鍵字過濾區啟用
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        {sortedKeywords.map((item) => (
          <CategoryToggleButton
            key={item.keyword}
            name={item.keyword}
            count={item.count}
            selected={selected.includes(item.keyword)}
            onToggle={() => toggleChecked(item.keyword)}
          />
        ))}
      </div>
    </section>
  );
};

export default BracketKeywordBlock;
