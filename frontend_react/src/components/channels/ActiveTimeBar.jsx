import React from "react";

// 對應色碼：Vivid 配色
const vividColors = {
  凌: "#6b7280",
  早: "#facc15",
  午: "#f97316",
  晚: "#6366f1",
};

const ActiveTimeBar = ({ activeTimeAll }) => {
  if (!activeTimeAll || !activeTimeAll.totalCount) return null;

  const sections = ["凌", "早", "午", "晚"];
  const total = activeTimeAll.totalCount;

  // 計算每個時段的百分比，過濾掉 0% 的時段
  const nonZeroSections = sections
    .map(key => ({
      key,
      percent: ((activeTimeAll[key] || 0) / total) * 100,
      color: vividColors[key]
    }))
    .filter(section => section.percent > 0);

  if (nonZeroSections.length === 0) return null;

  let gradient = "";
  let tooltip = "";

  if (nonZeroSections.length === 1) {
    // 只有一個時段有數據時，使用純色
    gradient = nonZeroSections[0].color;
    tooltip = `${nonZeroSections[0].key}: 100%`;
  } else {
    // 多個時段時，創建漸層效果
    const gradientStops = [];
    let acc = 0;

    nonZeroSections.forEach((section, index) => {
      const start = acc;
      const end = acc + section.percent;
      const transitionWidth = Math.min(section.percent * 0.1, 3); // 漸層寬度最多3%或該段的10%

      if (index === 0) {
        // 第一段
        gradientStops.push(`${section.color} 0%`);
        if (section.percent > transitionWidth * 2) {
          gradientStops.push(`${section.color} ${end - transitionWidth}%`);
        }
      } else if (index === nonZeroSections.length - 1) {
        // 最後一段
        if (section.percent > transitionWidth * 2) {
          gradientStops.push(`${section.color} ${start + transitionWidth}%`);
        }
        gradientStops.push(`${section.color} 100%`);
      } else {
        // 中間段
        if (section.percent > transitionWidth * 2) {
          gradientStops.push(`${section.color} ${start + transitionWidth}%`);
          gradientStops.push(`${section.color} ${end - transitionWidth}%`);
        }
      }

      tooltip += `${section.key}: ${Math.round(section.percent)}% `;
      acc = end;
    });

    gradient = `linear-gradient(to right, ${gradientStops.join(", ")})`;
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="text-xs text-gray-500 shrink-0">活躍時段：</div>
      <div
        className="h-2 flex-1 rounded"
        style={{ background: gradient }}
        title={`活躍時段分布：${tooltip.trim()}`}
      />
    </div>
  );
};

export default ActiveTimeBar;