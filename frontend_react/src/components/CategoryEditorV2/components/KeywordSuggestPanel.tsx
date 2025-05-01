import React, { useMemo } from 'react';
import { XCircle } from 'lucide-react';

import { useEditorStore } from '../hooks/useEditorStore';
import {
  CategorySettings,
  MainCategory,
  Video,
  NonGameMainCategory,
} from '../types/editor';

/* 主分類列表（排除「其他」「遊戲」） */
const MAIN_CATEGORIES: NonGameMainCategory[] = [
  '雜談',
  '節目',
  '音樂',
];

/* ------------------------------------------------------------------
 * KeywordSuggestPanel
 * ---------------------------------------------------------------- */
export default function KeywordSuggestPanel() {
  /** ===== Store ===== */
  const activeType = useEditorStore((s) => s.activeType);
  const videos = useEditorStore((s) => s.videos);
  const config = useEditorStore((s) => s.config);
  const removed = useEditorStore((s) => s.removedSuggestedKeywords);
  const addRemovedKeyword = useEditorStore(
    (s) => s.addRemovedKeyword
  );
  const updateConfigOfType = useEditorStore(
    (s) => s.updateConfigOfType
  );
  const markUnsaved = useEditorStore((s) => s.markUnsaved);

  /** ===== 目前類型的設定（若無則 {}） ===== */
  const currentSettings: CategorySettings =
    config[activeType] ?? {};

  /** ===== 已存在的關鍵字 Set（排除遊戲） ===== */
  const existingKeywords = new Set<string>();
  MAIN_CATEGORIES.forEach((cat) => {
    (currentSettings[cat] ?? []).forEach((k) =>
      existingKeywords.add(k)
    );
  });

  /** ===== 影片標題字詞統計 → 建議關鍵字 ===== */
  const suggestions = useMemo(() => {
    const stat: Record<string, number> = {};

    videos
      .filter((v: Video) => v.type === activeType)
      .forEach((v) => {
        const words = v.title.split(/[^\\p{L}\\p{N}]+/u).filter(Boolean);
        words.forEach((w) => {
          const word = w.trim();
          if (!word) return;
          stat[word] = (stat[word] || 0) + 1;
        });
      });

    // 轉成陣列後排序
    return Object.entries(stat)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .filter(
        (w) =>
          !existingKeywords.has(w) && !removed.includes(w) && w.length > 1
      )
      .slice(0, 50); // 只取前 50
  }, [videos, activeType, existingKeywords, removed]);

  /** ===== 新增關鍵字到主分類 ===== */
  const addKeyword = (cat: NonGameMainCategory, word: string) => {
    const oldSettings = currentSettings ?? {};
    const keywords = oldSettings[cat] ?? [];

    if (keywords.includes(word)) return;

    const newSettings: CategorySettings = {
      ...oldSettings,
      [cat]: [...keywords, word],
    };

    updateConfigOfType(activeType, newSettings);
    markUnsaved();
  };

  return (
    <section className="border p-3 rounded-lg">
      <header className="mb-2 font-semibold">🔍 建議關鍵字</header>

      {suggestions.length === 0 && (
        <p className="text-sm text-gray-400">
          沒有可建議的關鍵字
        </p>
      )}

      {suggestions.map((word) => (
        <div
          key={word}
          className="flex items-center justify-between py-1 border-b last:border-0 text-sm"
        >
          <span>{word}</span>
          <div className="flex gap-2">
            {MAIN_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-800"
                onClick={() => addKeyword(cat, word)}
              >
                加到 {cat}
              </button>
            ))}
            {/* Ignore */}
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => addRemovedKeyword(word)}
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
