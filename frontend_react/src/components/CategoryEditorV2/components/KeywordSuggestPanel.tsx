import React, { useMemo, useState } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import {
  CategorySettings,
  MainCategory,
  Video,
} from '../types/editor';

const MIN_FREQ = 3; // 高頻詞門檻

/** 主要分類下拉選項（不含「遊戲」「其他」）*/
const selectableCats: MainCategory[] = ['雜談', '節目', '音樂'];

export default function KeywordSuggestPanel() {
  /** ===== Store ===== */
  const activeType = useEditorStore((s) => s.activeType);
  const videos = useEditorStore((s) => s.videos);
  const config = useEditorStore((s) => s.config);
  const updateConfigOfType = useEditorStore(
    (s) => s.updateConfigOfType
  );
  const addRemovedKeyword = useEditorStore(
    (s) => s.addRemovedKeyword
  );
  const removed = useEditorStore((s) => s.removedSuggestedKeywords);
  const markUnsaved = useEditorStore((s) => s.markUnsaved);

  /** ===== Helper：統計詞頻 ===== */
  const {
    bracketWords,
    highFreqWords,
  }: {
    bracketWords: string[];
    highFreqWords: string[];
  } = useMemo(() => {
    const bracketSet = new Set<string>();
    const freq: Record<string, number> = {};

    const existingKeywords = new Set<string>();
    const cs = config?.[activeType] as CategorySettings | undefined;
    if (cs) {
      selectableCats.forEach((cat) =>
        cs[cat].forEach((k) => existingKeywords.add(k))
      );
      cs.遊戲.forEach((g) =>
        g.keywords.forEach((k) => existingKeywords.add(k))
      );
    }

    (videos as Video[])
      .filter((v) => v.type === activeType)
      .forEach((v) => {
        // 括號詞
        const brackets = [...v.title.matchAll(/\(([^)]+)\)/g)];
        brackets.forEach((m) => {
          const phrase = m[1].trim();
          if (
            phrase &&
            !existingKeywords.has(phrase) &&
            !removed.includes(phrase)
          ) {
            bracketSet.add(phrase);
          }
        });

        // 一般詞
        v.title
          .split(/[^a-zA-Z0-9\u4e00-\u9fff]+/u)
          .filter((w) => w.length > 1)
          .forEach((word) => {
            if (
              !existingKeywords.has(word) &&
              !removed.includes(word)
            ) {
              freq[word] = (freq[word] || 0) + 1;
            }
          });
      });

    const bracketWords = Array.from(bracketSet);

    // 高頻詞 (>= MIN_FREQ)，去掉括號詞
    const highFreqWords = Object.entries(freq)
      .filter(([_, count]) => count >= MIN_FREQ)
      .map(([w]) => w)
      .filter((w) => !bracketSet.has(w))
      .sort((a, b) => freq[b] - freq[a]) // 依出現次數排序
      .slice(0, 50); // 最多顯示 50

    // 把括號詞立刻加進正式關鍵字 (雜談)
    if (bracketWords.length > 0 && cs) {
      const newCat = { ...cs };
      newCat['雜談'] = Array.from(
        new Set([...cs['雜談'], ...bracketWords])
      );
      updateConfigOfType(activeType, newCat);
      markUnsaved(true);
    }

    return { bracketWords, highFreqWords };
  }, [videos, activeType, config, removed, updateConfigOfType, markUnsaved]);

  /** ===== Handlers ===== */
  const [catSelect, setCatSelect] = useState<Record<string, MainCategory>>(
    {}
  );

  const handleAddKeyword = (word: string) => {
    const cat = catSelect[word] || '雜談';
    const oldSettings = config[activeType];
    const newSettings: CategorySettings = {
      ...oldSettings,
      [cat]: [...oldSettings[cat], word],
    };
    updateConfigOfType(activeType, newSettings);
    markUnsaved(true);
  };

  const handleRemoveSuggestion = (word: string) => {
    addRemovedKeyword(word);
  };

  /** ===== Render ===== */
  return (
    <section className="border p-3 rounded-lg space-y-4">
      {/* 括號詞 */}
      <div>
        <h3 className="font-semibold mb-1">📎 括號詞 (已自動加入)</h3>
        {bracketWords.length === 0 ? (
          <p className="text-xs text-gray-400">無</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {bracketWords.map((w) => (
              <span
                key={w}
                className="text-xs bg-gray-300 dark:bg-gray-700 px-2 py-0.5 rounded"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 高頻詞 */}
      <div>
        <h3 className="font-semibold mb-1">🔍 高頻詞建議</h3>
        {highFreqWords.length === 0 ? (
          <p className="text-xs text-gray-400">目前沒有新的高頻詞</p>
        ) : (
          <ul className="space-y-1">
            {highFreqWords.map((w) => (
              <li
                key={w}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded"
              >
                <span className="flex-1 text-sm">{w}</span>

                {/* 選擇主分類 */}
                <select
                  className="text-xs border rounded px-1 py-0.5"
                  value={catSelect[w] || '雜談'}
                  onChange={(e) =>
                    setCatSelect({
                      ...catSelect,
                      [w]: e.target.value as MainCategory,
                    })
                  }
                >
                  {selectableCats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* + / × 按鈕 */}
                <button
                  className="text-green-600 text-sm px-1"
                  onClick={() => handleAddKeyword(w)}
                >
                  ＋
                </button>
                <button
                  className="text-red-600 text-sm px-1"
                  onClick={() => handleRemoveSuggestion(w)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
