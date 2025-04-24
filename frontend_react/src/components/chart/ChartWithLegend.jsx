import React from "react";
import ChartTypePie from "./ChartTypePie";

/**
 * ChartWithLegend
 * 圓餅 + 圖例卡片（水平置中，圖例垂直置中、距離更緊）
 */
const ChartWithLegend = ({ data = [], dataKey, unit = "部" }) => {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-400 border border-dashed border-gray-300 rounded">
        尚無可供統計的資料
      </div>
    );
  }

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7f50",
    "#a4de6c",
    "#d0ed57",
    "#8dd1e1",
  ];

  const total = safeData.reduce((sum, d) => sum + (d[dataKey] || 0), 0);

  /* === 共用格式化函式：小時固定 1 位小數 ===================== */
  const fmt = (val) =>
    unit.trim() === "小時" ? Number(val).toFixed(1) : val;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* 內容置中，圖例再向左貼近 */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-y-4 gap-x-2">
        {/* —— 甜甜圈圖 —— */}
        <div className="flex-shrink-0 w-full sm:w-[50%] xl:w-[45%] max-w-[320px] ">
          <ChartTypePie data={safeData} dataKey={dataKey} unit={unit} hideLegend />
        </div>

        {/* —— 表格式圖例 —— */}
        <div className="w-auto flex items-center sm:-ml-10">
          <table className="text-sm w-auto">
            <tbody>
              {safeData.map((item, idx) => {
                const value = item[dataKey] || 0;
                const percent =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                const color = COLORS[idx % COLORS.length];
                return (
                  <tr key={idx} className="leading-5">
                    <td className="pr-2 whitespace-nowrap">
                      <span
                        className="inline-block w-3 h-3 rounded-sm mr-1 align-middle"
                        style={{ backgroundColor: color }}
                      />
                      {item.category}
                    </td>
                    <td className="px-1 text-right whitespace-nowrap">
                      {/* ➜ 使用 fmt() 統一顯示格式 */}
                      {fmt(value)}
                      {unit}
                    </td>
                    <td className="pl-1 text-right whitespace-nowrap">
                      {percent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChartWithLegend;
