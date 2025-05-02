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

  console.log('[SelectedKeywordList] activeType:', activeType);
  console.log('[SelectedKeywordList] config:', config);
  console.log('[SelectedKeywordList] settings for type:', settings);

  const keywordList = Object.entries(settings)
    .filter(([category]) => category !== '其他')
    .flatMap(([category, value]) => {
      if (category === '遊戲') {
        const games = (value as GameEntry[]).map((entry) => entry.game);
        console.log(`[SelectedKeywordList] 遊戲分類 - 取出 game 名稱：`, games);
        return games;
      } else {
        console.log(`[SelectedKeywordList] ${category} 分類 - 取出關鍵字：`, value);
        return value as string[];
      }
    });

  console.log('[SelectedKeywordList] keywordList 結果：', keywordList);
  console.log('[SelectedKeywordList] activeKeywordFilter:', activeKeywordFilter);

  const handleRemove = (kw: string) => {
    console.log('[handleRemove] 移除關鍵字：', kw);

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
      console.log('[handleRemove] 目前正在篩選的關鍵字被移除，清除 activeKeywordFilter');
      setActiveKeywordFilter(null);
    }
  };

  const handleToggleFilter = (kw: string) => {
    const isSame = activeKeywordFilter === kw;
    console.log('[handleToggleFilter] 點擊關鍵字：', kw, '| isSame:', isSame);
    setActiveKeywordFilter(isSame ? null : kw);
  };

  if (keywordList.length === 0) {
    console.log('[SelectedKeywordList] 無任何關鍵字可顯示');
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">✅ 已套用的主題分類關鍵字</h3>
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
