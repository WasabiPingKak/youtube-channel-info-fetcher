import React from "react";

const DEFAULT_OPTIONS = {
  game: [
    { value: "name-asc", label: "主名稱 A→Z" },
    { value: "name-desc", label: "主名稱 Z→A" },
    { value: "alias-more", label: "別名數量 多→少" },
    { value: "alias-less", label: "別名數量 少→多" },
  ],
  category: [
    { value: "name-asc", label: "子分類 A→Z" },
    { value: "name-desc", label: "子分類 Z→A" },
    { value: "alias-more", label: "別名數量 多→少" },
    { value: "alias-less", label: "別名數量 少→多" },
  ],
};

const PLACEHOLDER_TEXT = {
  game: "搜尋主名稱或別名...",
  category: "搜尋子分類或別名...",
};

const AliasSearchBar = ({
  searchText,
  setSearchText,
  sortOption,
  setSortOption,
  mode = "game", // "game" | "category"
}) => {
  const options = DEFAULT_OPTIONS[mode] ?? DEFAULT_OPTIONS.game;
  const placeholder = PLACEHOLDER_TEXT[mode] ?? PLACEHOLDER_TEXT.game;

  return (
    <div className="flex gap-4 mb-4">
      <input
        type="text"
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="border rounded px-3 py-2 w-full"
      />
      <select
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        className="border rounded px-2 py-2"
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AliasSearchBar;
