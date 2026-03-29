import React, { useState } from "react";
import TopicHelpModal from "./TopicHelpModal";
import { FaInfoCircle } from "react-icons/fa";

type TopicKey = "遊戲" | "雜談" | "節目" | "音樂" | "其他" | "未分類";

const MAIN_COLOR_CLASS: Record<TopicKey, string> = {
  遊戲: "bg-indigo-500 text-white",
  雜談: "bg-emerald-500 text-white",
  節目: "bg-yellow-400 text-yellow-900",
  音樂: "bg-orange-400 text-white",
  其他: "bg-slate-400 text-slate-800",
  未分類: "bg-gray-300 text-gray-700",
};

const MAIN_PALE_CLASS: Record<TopicKey, string> = {
  遊戲: "bg-indigo-100 text-indigo-800",
  雜談: "bg-emerald-100 text-emerald-800",
  節目: "bg-yellow-100 text-yellow-800",
  音樂: "bg-orange-100 text-orange-800",
  其他: "bg-slate-100 text-slate-800",
  未分類: "bg-gray-100 text-gray-800",
};

const TOPICS = [
  { label: "雜談", key: "雜談" },
  { label: "遊戲", key: "遊戲" },
  { label: "音樂", key: "音樂" },
  { label: "節目", key: "節目" },
  { label: "無法分類", key: "未分類" },
];

interface LiveTopicFilterPanelProps {
  selectedTopics: string[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<string[]>>;
  topicStats: Record<string, number>;
}

export default function LiveTopicFilterPanel({
  selectedTopics,
  setSelectedTopics,
  topicStats,
}: LiveTopicFilterPanelProps) {
  const [showHelp, setShowHelp] = useState(false); // ✅ state for modal

  const toggle = (key: string) => {
    setSelectedTopics((prev: string[]) =>
      prev.includes(key) ? prev.filter((k: string) => k !== key) : [...prev, key]
    );
  };

  const clear = () => setSelectedTopics([]);

  return (
    <div className="border border-gray-300 dark:border-zinc-600 p-4 rounded-xl bg-white dark:bg-zinc-800 mb-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        {TOPICS.map(({ label, key }) => {
          const active = selectedTopics.includes(key);
          const count = topicStats[key] || 0;
          const colorClass = active
            ? MAIN_COLOR_CLASS[key as TopicKey] || "bg-gray-300 text-gray-700"
            : MAIN_PALE_CLASS[key as TopicKey] || "bg-gray-100 text-gray-800";

          return (
            <button
              key={key}
              className={`px-3 py-1 rounded border border-transparent flex items-center gap-2 font-medium transition-colors ${colorClass}`}
              onClick={() => toggle(key)}
            >
              <input
                type="checkbox"
                readOnly
                checked={active}
                className="pointer-events-none"
              />
              <span>{label}（{count}）</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2">

        <button
          onClick={clear}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500 rounded px-3 py-1 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
        >
          🗑️ 清除條件
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
        >
          <span className="inline-block w-4 h-4">
            <FaInfoCircle className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </span>
          <span className="underline">分類說明</span>
        </button>
      </div>

      <TopicHelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
