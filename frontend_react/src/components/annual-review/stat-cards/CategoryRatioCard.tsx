import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Label,
  Tooltip,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";

interface CategoryRatioCardProps {
  categoryTime: {
    category: string;
    seconds: number;
  }[];
}

const BASE_COLORS: Record<string, string> = {
  遊戲: "#504ac6",
  雜談: "#4cb373",
  節目: "#ffac0c",
  音樂: "#ff7f50",
  未分類: "#9ca3af", // 類別未知 = 灰色
};

export default function CategoryRatioCard({
  categoryTime,
}: CategoryRatioCardProps) {
  const isDarkMode =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  // 資料整理與排序：未分類固定最後，其餘依 hours 排序
  const allData = categoryTime.map((c) => ({
    category: c.category,
    hours: parseFloat((c.seconds / 3600).toFixed(1)),
  }));
  const uncategorized = allData.find((item) => item.category === "未分類");
  const categorized = allData
    .filter((item) => item.category !== "未分類")
    .sort((a, b) => b.hours - a.hours);
  const data = uncategorized ? [...categorized, uncategorized] : categorized;

  const total = data.reduce((sum, item) => sum + item.hours, 0);
  const isEmpty = data.length === 0 || data.every((d) => d.hours === 0);

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const { category, hours } = payload[0].payload;
      const displayName = category === "未分類" ? "類別未知" : category;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 px-2 py-1 text-sm shadow">
          {`${displayName}: ${hours.toFixed(1)} 小時`}
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => (
    <table className="text-sm w-full">
      <tbody>
        {data.map((item, idx) => {
          const percent =
            total > 0 ? ((item.hours / total) * 100).toFixed(1) : "0.0";
          const displayName =
            item.category === "未分類" ? "類別未知" : item.category;
          return (
            <tr key={idx} className="border-b border-border">
              <td colSpan={3} className="py-2">
                <div className="flex flex-col">
                  <span className="text-[14px] flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor:
                          BASE_COLORS[item.category] ?? "#999999",
                      }}
                    />
                    {displayName}
                  </span>
                  <span className="text-sm text-muted-foreground pl-4">
                    {item.hours.toFixed(1)} 小時　{percent}%
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <StatCardWrapper delay={0.1} className="md:h-full">
      <div className="flex flex-col h-full">
        {/* ---------------------- */}
        {/* [分類直播時長佔比] */}
        {/* ---------------------- */}
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-muted p-2">
            <PieIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            分類直播時長佔比
          </div>
        </div>

        {/* ---------------------- */}
        {/* [圓餅][Label]：卡片內垂直置中 */}
        {/* ---------------------- */}
        <div className="flex-1 flex items-center justify-center">
          {isEmpty ? (
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              尚無可供統計的資料
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4 md:items-center w-full">
              {/* 圓餅 */}
              <div className="w-full md:w-1/2 h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="hours"
                      nameKey="category"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      label={false}
                      cx="50%"
                      cy="50%"
                    >
                      {data.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={BASE_COLORS[entry.category] ?? "#999999"}
                        />
                      ))}
                      <Label
                        value={`共 ${total.toFixed(1)} 小時`}
                        position="center"
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          fill: isDarkMode ? "#e5e7eb" : "#374151",
                        }}
                      />
                    </Pie>
                    <Tooltip
                      content={renderTooltip}
                      wrapperStyle={{ outline: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Label/Legend */}
              <div className="w-full md:w-1/2">{renderLegend()}</div>
            </div>
          )}
        </div>
      </div>
    </StatCardWrapper>
  );
}
