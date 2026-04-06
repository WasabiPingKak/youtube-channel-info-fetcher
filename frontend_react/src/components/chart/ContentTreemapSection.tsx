import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { transformVideosToTreemapData } from "./transformVideosToTreemapData";
import { getTreemapOption } from "./getTreemapOption";
import { ArrowLeft } from "lucide-react";
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

  const handleChartClick = (e: { data?: { children?: unknown[]; name?: string } }) => {
    if (!selectedCategory && e?.data?.children) {
      setSelectedCategory(e.data.name ?? null);
    }
  };

  return (
    <div>
      {selectedCategory && (
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-1 mb-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft size={14} />
          返回總覽
        </button>
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
            onEvents={{ click: handleChartClick }}
          />
        </div>
      )}
    </div>
  );
};

export default ContentTreemapSection;
