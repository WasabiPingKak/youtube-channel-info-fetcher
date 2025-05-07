import React from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { downloadConfigJson } from '../utils/exportConfig';

export default function ExportConfigButton() {
  // ✅ 使用正確的匯出方法：取得完整三分頁設定
  const getFullMergedConfig = useEditorStore((s) => s.getFullMergedConfig);

  const handleExport = () => {
    const config = getFullMergedConfig();

    // ✅ 無論是否為空都允許匯出
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
