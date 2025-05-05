// components/ExportConfigButton.tsx
// --------------------------------------------------
// 一鍵匯出當前影片 badges → settings/config JSON
// --------------------------------------------------

import React from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { downloadConfigJson } from '../utils/exportConfig';

export default function ExportConfigButton() {
  const config = useEditorStore((s) => s.config);

  const handleExport = () => {
    if (!config || Object.keys(config).length === 0) return;
    const cfg = config;
    downloadConfigJson(cfg);
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
