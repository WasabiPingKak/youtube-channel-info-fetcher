// components/KeywordSuggestPanel.tsx
import React from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { useKeywordSuggestion } from '../hooks/useKeywordSuggestion';

export default function KeywordSuggestPanel() {
  const videos = useEditorStore((s) => s.videos);
  const removed = useEditorStore((s) => s.removedSuggestedKeywords);
  const addRemovedKeyword = useEditorStore((s) => s.addRemovedKeyword);
  const addKeywordToCategory = useEditorStore((s) => s.addKeywordToCategory);
  const setUnsaved = useEditorStore((s) => s.setUnsaved);

  const { bracketKeywords, frequentKeywords, rebuild } = useKeywordSuggestion(videos, removed);

  const handleIgnore = (keyword: string) => {
    addRemovedKeyword(keyword);
    rebuild();
  };

  const handleAdd = (keyword: string) => {
    addKeywordToCategory(keyword, '雜談'); // 暫定加入「雜談」主分類
    setUnsaved(true);
    rebuild();
  };

  const renderKeywordItem = (
    item: { keyword: string; count: number },
    actions: React.ReactNode
  ) => (
    <div key={item.keyword} className="flex justify-between items-center px-2 py-1 border-b text-sm">
      <span>{item.keyword} <span className="text-xs text-gray-400">({item.count})</span></span>
      <div className="flex gap-1">{actions}</div>
    </div>
  );

  return (
    <div className="p-3 border rounded-xl space-y-4 bg-white shadow">
      <div>
        <h3 className="font-semibold mb-2">📎 標題括號建議</h3>
        <div className="border rounded">
          {bracketKeywords.length === 0 ? (
            <div className="p-2 text-gray-400 text-sm">（無括號建議）</div>
          ) : (
            bracketKeywords.map((item) =>
              renderKeywordItem(item, (
                <button
                  className="text-red-500 text-xs"
                  onClick={() => handleIgnore(item.keyword)}
                >
                  ×
                </button>
              ))
            )
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">🔍 高頻關鍵字建議</h3>
        <div className="border rounded">
          {frequentKeywords.length === 0 ? (
            <div className="p-2 text-gray-400 text-sm">（無高頻建議）</div>
          ) : (
            frequentKeywords.map((item) =>
              renderKeywordItem(item, (
                <>
                  <button
                    className="text-blue-500 text-xs"
                    onClick={() => handleAdd(item.keyword)}
                  >
                    ＋
                  </button>
                  <button
                    className="text-red-500 text-xs"
                    onClick={() => handleIgnore(item.keyword)}
                  >
                    ×
                  </button>
                </>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
