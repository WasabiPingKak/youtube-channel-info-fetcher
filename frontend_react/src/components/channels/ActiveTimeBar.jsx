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

  const nonZeroSections = sections
    .map((key) => ({
      key,
      percent: ((activeTimeAll[key] || 0) / total) * 100,
      color: vividColors[key],
    }))
    .filter((section) => section.percent > 0);

  if (nonZeroSections.length === 0) return null;

  let gradient = "";
  let tooltip = "";

  if (nonZeroSections.length === 1) {
    gradient = nonZeroSections[0].color;
    tooltip = `${nonZeroSections[0].key}: 100%`;
  } else {
    const gradientStops = [];
    let acc = 0;

    nonZeroSections.forEach((section, index) => {
      const start = acc;
      const end = acc + section.percent;
      const transitionWidth = Math.min(section.percent * 0.1, 3);

      if (index === 0) {
        gradientStops.push(`${section.color} 0%`);
        if (section.percent > transitionWidth * 2) {
          gradientStops.push(`${section.color} ${end - transitionWidth}%`);
        }
      } else if (index === nonZeroSections.length - 1) {
        if (section.percent > transitionWidth * 2) {
          gradientStops.push(`${section.color} ${start + transitionWidth}%`);
        }
        gradientStops.push(`${section.color} 100%`);
      } else {
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
      <div className="text-xs text-gray-500 dark:text-gray-400 shrink-0">活躍時段：</div>
      <div
        className="h-2 flex-1 rounded"
        style={{ background: gradient }}
        title={`活躍時段分布：${tooltip.trim()}`}
      />
    </div>
  );
};

export default ActiveTimeBar;
