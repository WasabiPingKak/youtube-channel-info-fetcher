// components/SelectedKeywordList.tsx
import React from 'react';
import { useEditorStore } from '../hooks/useEditorStore';

export default function SelectedKeywordList() {
  const config = useEditorStore((s) => s.config);
  const activeType = useEditorStore((s) => s.activeType);
  const activeKeywordFilter = useEditorStore((s) => s.activeKeywordFilter);
  const setActiveKeywordFilter = useEditorStore((s) => s.setActiveKeywordFilter);
  const setConfig = useEditorStore((s) => s.setConfig);
  const setUnsaved = useEditorStore((s) => s.setUnsaved);

  const keywordList = config?.[activeType]?.['雜談'] ?? [];

  const handleRemove = (kw: string) => {
    const newList = keywordList.filter((k) => k !== kw);
    const newConfig = { ...config };

    if (!newConfig[activeType]) {
      newConfig[activeType] = { 雜談: [] };
    }
    newConfig[activeType]!['雜談'] = newList;

    setConfig(newConfig);
    setUnsaved(true);

    // 若正在篩選此詞，移除時也清除過濾狀態
    if (activeKeywordFilter === kw) {
      setActiveKeywordFilter(null);
    }
  };

  const handleToggleFilter = (kw: string) => {
    setActiveKeywordFilter(activeKeywordFilter === kw ? null : kw);
  };

  if (keywordList.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">✅ 已選分類關鍵字</h3>
      <div className="flex flex-wrap gap-2">
        {keywordList.map((kw) => {
          const isActive = activeKeywordFilter === kw;
          return (
            <span
              key={kw}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800'
              }`}
              onClick={() => handleToggleFilter(kw)}
            >
              {kw}
              <button
                className={`ml-1 text-xs ${
                  isActive ? 'text-white' : 'text-red-500 hover:text-red-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(kw);
                }}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
