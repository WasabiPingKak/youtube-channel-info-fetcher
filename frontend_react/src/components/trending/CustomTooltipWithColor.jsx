import React from "react";

const CustomTooltipWithColor = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const tooltipData = payload[0]?.payload?.tooltipData;
  if (!tooltipData) return null;

  return (
    <div className="bg-white border rounded shadow-md p-3 text-sm max-w-xs">
      {/* 日期 */}
      <div className="font-bold mb-2">📅 {label}</div>

      {/* 遊戲資料區塊 */}
      {payload.map((entry) => {
        const game = entry.dataKey;
        const channels = tooltipData[game] || [];
        if (channels.length === 0) return null;

        return (
          <div key={game} className="mb-3">
            {/* 遊戲標題 + 色塊 + 字體上色 */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span
                className="font-semibold"
                style={{ color: entry.color }}
              >
                {game}
              </span>
            </div>

            {/* 頻道列表 */}
            <ul className="ml-5 list-disc text-gray-700 space-y-0.5">
              {channels.map((c, idx) => (
                <li key={idx}>
                  {c.channelName || "（未知頻道）"}：
                  <span className="text-gray-500"> {c.count} 部</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default CustomTooltipWithColor;
