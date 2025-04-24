import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

/**
 * ChartTypePie
 * 甜甜圈圖 + 圓心總數文字 + Hover Tooltip
 *
 * @param {Array<{ category: string; [key: string]: number }>} data
 * @param {string} dataKey  - 欄位名稱："count" | "duration"
 * @param {"部" | "分鐘" | "小時"} unit - 單位文字
 * @param {boolean} hideLegend - 是否隱藏內建 Legend（交由外層處理）
 */
const ChartTypePie = ({ data, dataKey, unit = "部", hideLegend = false }) => {
  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7f50",
    "#a4de6c",
    "#d0ed57",
    "#8dd1e1",
  ];

  // 計算總和數值
  const total = data.reduce((sum, d) => sum + (d[dataKey] || 0), 0);
  const isEmpty = data.length === 0 || data.every((d) => (d[dataKey] || 0) === 0);

  /* ---------- 自訂 Legend（表格式三欄） ---------- */
  const renderLegend = ({ payload }) => (
    <table className="text-sm">
      <tbody>
        {payload.map((entry, idx) => {
          const { payload: item, color } = entry;
          const value = item[dataKey] || 0;
          const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
          const displayValue = unit === "小時" ? value.toFixed(1) : value;
          return (
            <tr key={idx} className="leading-5">
              <td className="pr-2 whitespace-nowrap">
                <span
                  className="inline-block w-3 h-3 rounded-sm mr-1 align-middle"
                  style={{ backgroundColor: color }}
                />
                {item.category}
              </td>
              <td className="pr-2 text-right whitespace-nowrap">
                {displayValue}
                {unit}
              </td>
              <td className="text-right whitespace-nowrap">{percent}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  /* ---------- 自訂 Tooltip ---------- */
  const renderTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { category } = payload[0].payload;
      const value = payload[0].value;
      const display = unit === "小時" ? value.toFixed(1) : value;
      return (
        <div className="bg-white border border-gray-300 px-2 py-1 text-sm shadow">
          {`${category}: ${display}${unit}`}
        </div>
      );
    }
    return null;
  };

  /* ---------- 空狀態 ---------- */
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-[250px] text-gray-400">
        尚無可供統計的資料
      </div>
    );
  }

  /* ---------- 主體 Doughnut ---------- */
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        {/* —— Doughnut 圓餅 —— */}
        <Pie
          data={data}
          dataKey={dataKey}
          cx="35%"
          cy="50%"
          innerRadius="50%"
          outerRadius="80%"
          paddingAngle={2}
          label={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          {/* —— 中央統計文字 —— */}
          <Label
            value={`共 ${unit === "小時" ? total.toFixed(1) : total} ${unit}`}
            position="center"
            style={{ fontSize: "1rem", fontWeight: 600, fill: "#374151" }}
          />
        </Pie>

        {/* —— Hover Tooltip —— */}
        <Tooltip content={renderTooltip} wrapperStyle={{ outline: "none" }} />

        {/* —— 自訂圖例 —— */}
        {!hideLegend && (
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            content={renderLegend}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ChartTypePie;