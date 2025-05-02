// components/SelectedKeywordList.tsx
import React from 'react';
import { useEditorStore } from '../hooks/useEditorStore';

export default function SelectedKeywordList() {
  const config = useEditorStore((s) => s.config);
  const activeType = useEditorStore((s) => s.activeType);
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
  };

  if (keywordList.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">✅ 已選分類關鍵字</h3>
      <div className="flex flex-wrap gap-2">
        {keywordList.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
          >
            {kw}
            <button
              className="ml-1 text-xs text-red-500 hover:text-red-700"
              onClick={() => handleRemove(kw)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
