import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { transformVideosToTreemapData } from "./transformVideosToTreemapData";
import { getTreemapOption } from "./getTreemapOption";
import { getCategoryColorScheme } from "@/utils/categoryColors";
import type { ClassifiedVideoItem } from "@/types/category";

interface ContentTreemapSectionProps {
  videos: ClassifiedVideoItem[];
}

const ContentTreemapSection = ({ videos }: ContentTreemapSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fullTreemapData = useMemo(() => {
    const transformed = transformVideosToTreemapData(videos as Parameters<typeof transformVideosToTreemapData>[0]).filter(
      (node) => node.name !== "undefined"
    );
    return transformed;
  }, [videos]);

  // 可用的分類名稱（從資料中取，保留順序）
  const categoryNames = useMemo(
    () => fullTreemapData.map((node) => node.name),
    [fullTreemapData],
  );

  const filteredTreemapData = useMemo(() => {
    if (!selectedCategory) return fullTreemapData;
    const categoryNode = fullTreemapData.find((node) => node.name === selectedCategory);
    return categoryNode ? categoryNode.children || [] : [];
  }, [selectedCategory, fullTreemapData]);

  const hasContent = filteredTreemapData.length > 0;

  const option = getTreemapOption({
    data: filteredTreemapData,
    selectedCategory,
  });

  return (
    <div>
      {/* 分類 chip 列 */}
      {categoryNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === null
                ? "bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900"
                : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            全部
          </button>
          {categoryNames.map((name) => {
            const isActive = selectedCategory === name;
            const colors = getCategoryColorScheme(name);
            return (
              <button
                key={name}
                onClick={() => setSelectedCategory(name)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? `${colors.bg} ${colors.text}`
                    : `${colors.bgMuted} ${colors.textMuted} ${colors.bgMutedDark} ${colors.textMutedDark} hover:opacity-80`
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {!hasContent ? (
        <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
          目前沒有足夠的分類資料
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <ReactECharts
            option={option}
            style={{ height: 420 }}
          />
        </div>
      )}
    </div>
  );
};

export default ContentTreemapSection;
