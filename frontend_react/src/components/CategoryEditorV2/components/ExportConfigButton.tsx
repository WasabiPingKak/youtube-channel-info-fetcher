// components/ExportConfigButton.tsx
// --------------------------------------------------
// 一鍵匯出當前影片 badges → settings/config JSON
// --------------------------------------------------

import React from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { downloadConfigJson } from '../utils/exportConfig';

export default function ExportConfigButton() {
  // 直接讀取 store 裡的 config（已經透過 loadConfig / applyBadges / removeBadges 維護過）
  const config = useEditorStore((s) => s.config);

  const handleExport = () => {
    // 若尚未載入或完全空物件，可直接不動作或提示使用者先載入
    if (!config || Object.keys(config).length === 0) return;
    downloadConfigJson(config);
  };

  return (
    <button
      onClick={handleExport}
      className="text-sm px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 ml-2"
    >
      匯出設定 JSON
    </button>
  );
}
