import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Props
 * @param {Array<{ category: string; [key: string]: number }>} data
 * @param {string} dataKey          - 欄位名稱：'count' | 'duration'
 * @param {"部" | "分鐘" | "小時"}  unit            - 中央文字與圖例的單位
 */
const ChartTypePie = ({ data, dataKey, unit = "部" }) => {
  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7f50",
    "#a4de6c",
    "#d0ed57",
    "#8dd1e1",
  ];

  // 計算總數
  const total = data.reduce((sum, d) => sum + (d[dataKey] || 0), 0);

  // 判斷是否為空狀態
  const isEmpty =
    data.length === 0 || data.every((d) => (d[dataKey] || 0) === 0);

  /* ---------- 自訂 Legend ---------- */
  const renderLegend = ({ payload }) => (
    <ul className="space-y-1 text-sm">
      {payload.map((entry, idx) => {
        const { payload: item, color } = entry;
        const value = item[dataKey] || 0;
        const percent =
          total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
        return (
          <li key={idx} className="flex items-center space-x-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span>
              {item.category}　{value}
              {unit}（{percent}%）
            </span>
          </li>
        );
      })}
    </ul>
  );

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
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        {/* —— 中央統計文字 —— */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm fill-gray-700"
        >
          共 {total} {unit}
        </text>

        {/* —— 自訂圖例 —— */}
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          content={renderLegend}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ChartTypePie;
