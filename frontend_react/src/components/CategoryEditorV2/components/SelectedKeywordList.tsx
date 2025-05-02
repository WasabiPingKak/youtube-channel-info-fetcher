// components/SelectedKeywordList.tsx
import React from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import type { GameEntry } from '../types/editor';

export default function SelectedKeywordList() {
  const config = useEditorStore((s) => s.config);
  const activeType = useEditorStore((s) => s.activeType);
  const activeKeywordFilter = useEditorStore((s) => s.activeKeywordFilter);
  const setActiveKeywordFilter = useEditorStore((s) => s.setActiveKeywordFilter);
  const setConfig = useEditorStore((s) => s.setConfig);
  const setUnsaved = useEditorStore((s) => s.setUnsaved);

  const settings = config?.[activeType] ?? {};

  const keywordList = Object.entries(settings)
    .filter(([category]) => category !== '其他')
    .flatMap(([category, value]) => {
      if (category === '遊戲') {
        return (value as GameEntry[]).map((entry) => entry.game);
      } else {
        return value as string[];
      }
    });

  const handleRemove = (kw: string) => {
    const newConfig = { ...config };
    const newSettings = { ...settings };

    for (const [category, value] of Object.entries(settings)) {
      if (category === '其他') continue;

      if (category === '遊戲') {
        const updated = (value as GameEntry[]).filter((entry) => entry.game !== kw);
        newSettings[category] = updated;
      } else {
        const updated = (value as string[]).filter((k) => k !== kw);
        newSettings[category] = updated;
      }
    }

    newConfig[activeType] = newSettings;
    setConfig(newConfig);
    setUnsaved(true);

    if (activeKeywordFilter === kw) {
      setActiveKeywordFilter(null);
    }
  };

  const handleToggleFilter = (kw: string) => {
    const isSame = activeKeywordFilter === kw;
    setActiveKeywordFilter(isSame ? null : kw);
  };

  if (keywordList.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">✅ 運作中的分類關鍵字</h3>
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
