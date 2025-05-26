import React from "react";
import ChannelSelectorCard from "./ChannelSelectorCard";

/**
 * 解析 Firestore Timestamp 或 ISO 字串為 Date 物件
 */
const toDateObj = (raw) => {
  if (!raw) return null;

  if (typeof raw === "string") {
    const parsed = new Date(raw);
    return isNaN(parsed) ? null : parsed;
  }

  if (typeof raw.toDate === "function") {
    return raw.toDate();
  }

  try {
    return new Date(raw);
  } catch {
    return null;
  }
};

/**
 * 格式化為 yyyy-MM-dd（供排序使用）
 */
const formatDateKey = (dateObj) => {
  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 顯示文字：今天 / 昨天 / yyyy-MM-dd
 */
const getDisplayDateLabel = (dateObj) => {
  const today = new Date();
  const yesterday = new Date();
  today.setHours(0, 0, 0, 0);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const input = new Date(dateObj);
  input.setHours(0, 0, 0, 0);

  if (input.getTime() === today.getTime()) return "今天";
  if (input.getTime() === yesterday.getTime()) return "昨天";

  return formatDateKey(input);
};

/**
 * 將頻道依據 joinedAt 日期分組
 */
const groupByJoinedDate = (channels) => {
  const groups = {};

  channels.forEach((channel) => {
    const dateObj = toDateObj(channel.joinedAt);
    if (!dateObj) return;

    const dateKey = formatDateKey(dateObj);
    const displayLabel = getDisplayDateLabel(dateObj);

    if (!groups[dateKey]) {
      groups[dateKey] = {
        label: displayLabel,
        list: []
      };
    }

    groups[dateKey].list.push(channel);
  });

  // 回傳依照日期倒序排列
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([_, group]) => group);
};

const NewlyJoinedChannelsSection = ({ channels, onClick }) => {
  if (!channels || channels.length === 0) return null;

  const grouped = groupByJoinedDate(channels);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
      <h2 className="text-sm font-bold text-yellow-800 mb-3">新加入的頻道</h2>

      {grouped.map((group) => (
        <div key={group.label} className="mb-6">
          <p className="text-xs font-semibold text-yellow-700 mb-2">{group.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {group.list.map((channel) => (
              <ChannelSelectorCard
                key={channel.channel_id}
                channel={channel}
                onClick={onClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewlyJoinedChannelsSection;
