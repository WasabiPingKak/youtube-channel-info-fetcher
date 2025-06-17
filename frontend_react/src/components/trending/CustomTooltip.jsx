import React from "react";

// Recharts 傳進來的 payload 為 [{ name, value, color }, ...]
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  // 過濾掉數值為 0 的條目（可選）
  const sortedPayload = [...payload]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white shadow-md rounded p-3 border border-gray-300 text-sm">
      <div className="font-semibold mb-1">{label}</div>
      <ul className="space-y-0.5">
        {sortedPayload.map((entry) => (
          <li key={entry.name} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-800">{entry.name}</span>
            <span className="text-gray-500">：{entry.value} 部</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomTooltip;
