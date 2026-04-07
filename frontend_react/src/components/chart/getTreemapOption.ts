interface TreemapDataItem {
  name: string;
  value: number;
  videoCount?: number;
  lastUpdatedDaysAgo?: number;
  children?: TreemapDataItem[];
}

interface TreemapProps {
  data: TreemapDataItem[];
  selectedCategory: string | null;
}

export function getTreemapOption({ data, selectedCategory }: TreemapProps) {
  const isDark = document.documentElement.classList.contains("dark");
  const borderColor = isDark ? "#27272a" : "#f9fafb";
  const labelColor = isDark ? "#e5e7eb" : "#1f2937";
  const upperLabelColor = isDark ? "#d1d5db" : "#111827";

  return {
    tooltip: {
      backgroundColor: isDark ? "#27272a" : "#fff",
      borderColor: isDark ? "#3f3f46" : "#e5e7eb",
      textStyle: { color: isDark ? "#e5e7eb" : "#374151", fontSize: 13 },
      formatter: (info: { name: string; value: number; data: TreemapDataItem }) => {
        const { name, value, data } = info;
        if (!data?.videoCount) return "";
        return `
          <div style="line-height:1.6">
            <strong>${name}</strong><br/>
            總時長：${value.toFixed(1)} 小時<br/>
            影片數：${data.videoCount} 部<br/>
            最近更新：${data.lastUpdatedDaysAgo} 天前
          </div>
        `;
      },
    },
    series: [
      {
        type: "treemap",
        left: 12,
        top: 12,
        right: 12,
        bottom: 12,
        data,
        leafDepth: selectedCategory ? 1 : 2,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          fontSize: 13,
          color: labelColor,
          formatter: "{b}",
        },
        upperLabel: {
          show: !selectedCategory,
          height: 28,
          color: upperLabelColor,
          fontSize: 12,
          fontWeight: 600,
        },
        itemStyle: {
          borderColor,
          borderRadius: 4,
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 4,
            },
          },
          {
            itemStyle: {
              gapWidth: 2,
              borderRadius: 3,
            },
          },
          {
            colorSaturation: [0.3, 0.55],
            itemStyle: {
              gapWidth: 1,
              borderColorSaturation: 0.5,
              borderRadius: 2,
            },
          },
        ],
      },
    ],
  };
}
