import React, { useState, useEffect } from "react";
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
 * 使用當地時間格式化為 yyyy-MM-dd（供排序使用）
 */
const formatDateKey = (dateObj) => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 顯示文字：今天 / 昨天 / yyyy-MM-dd（以當地時間計算）
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
        list: [],
      };
    }

    groups[dateKey].list.push(channel);
  });

  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([_, group]) => group);
};

const STORAGE_KEY = "newlyJoinedExpanded";

const NewlyJoinedChannelsSection = ({ channels, onClick }) => {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "false") {
      setExpanded(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, expanded ? "true" : "false");
  }, [expanded]);

  if (!channels || channels.length === 0) return null;

  const grouped = groupByJoinedDate(channels);

  return (
    <div className="bg-yellow-50 dark:bg-yellow-100/10 border border-yellow-200 dark:border-yellow-300/30 rounded-xl p-4 mb-8">
      <div className="flex items-center mb-3">
        <h2 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mr-4">
          新加入的頻道
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
        >
          {expanded ? "隱藏" : "顯示"}
        </button>
      </div>

      {expanded &&
        grouped.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
              {group.label}
            </p>
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
