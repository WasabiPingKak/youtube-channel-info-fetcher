import React from "react";

const FIXED_CATEGORY_ORDER = ["遊戲", "雜談", "節目", "音樂"];
const STATIC_CATEGORIES = ["全部", ...FIXED_CATEGORY_ORDER, "未分類"];

const SubCategoryTabs = ({
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4 px-4">
      {STATIC_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-1 rounded-full border ${activeCategory === category
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 border-gray-300"
            }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default SubCategoryTabs;
