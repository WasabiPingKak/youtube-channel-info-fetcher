interface TreemapProps {
  data: any[];
  selectedCategory: string | null;
}

export function getTreemapOption({ data, selectedCategory }: TreemapProps) {
  return {
    tooltip: {
      formatter: (info: any) => {
        const { name, value, data } = info;
        if (!data?.videoCount) return "";
        return `
          <div>
            <strong>${name}</strong><br/>
            總時長：${value.toFixed(2)} 小時<br/>
            影片數：${data.videoCount} 部<br/>
            最近更新：${data.lastUpdatedDaysAgo} 天前
          </div>
        `;
      },
    },
    series: [
      {
        type: "treemap",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        data,
        leafDepth: 2,
        roam: false,
        nodeClick: selectedCategory ? false : "zoom",
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: "{b}",
        },
        upperLabel: {
          show: true,
          height: 24,
          color: "#000",
          fontWeight: "bold",
        },
        itemStyle: {
          borderColor: "#fff",
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 5,
            },
          },
          {
            itemStyle: {
              gapWidth: 1,
            },
          },
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
              gapWidth: 1,
              borderColorSaturation: 0.6,
            },
          },
        ],
      },
    ],
  };
}
