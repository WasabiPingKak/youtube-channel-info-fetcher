import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { transformVideosToTreemapData } from "./transformVideosToTreemapData";
import { getTreemapOption } from "./getTreemapOption";

const ContentTreemapSection = ({ videos }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fullTreemapData = useMemo(() => {
    const transformed = transformVideosToTreemapData(videos).filter(
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

  const handleChartClick = (e) => {
    if (!selectedCategory && e?.data?.children) {
      setSelectedCategory(e.data.name);
    }
  };

  return (
    <div className="py-4">
      <div className="p4">
        <h2 className="text-lg font-semibold">頻道熱力圖</h2>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="mt-1 text-sm text-blue-600 hover:underline"
          >
            ← 返回總覽
          </button>
        )}
      </div>
      {!hasContent ? (
        <p className="text-gray-500 px-4">目前沒有足夠的分類資料顯示熱力圖。</p>
      ) : (
        <div className="bg-white shadow p-4 border border-gray-200">
          <ReactECharts
            option={option}
            style={{ height: 600 }}
            onEvents={{ click: handleChartClick }}
          />
        </div>
      )}
    </div>
  );
};

export default ContentTreemapSection;
