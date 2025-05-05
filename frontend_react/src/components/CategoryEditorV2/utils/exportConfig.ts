// utils/exportConfig.ts
// --------------------------------------------------
// 提供下載 JSON 設定檔功能
// --------------------------------------------------

import type { CategoryConfig } from '../types/editor';

/**
 * 下載 JSON 檔
 * @param cfg CategoryConfig 物件
 * @param filename 檔名 (預設 video_badges_config.json)
 */
export function downloadConfigJson(
  cfg: CategoryConfig,
  filename = 'video_badges_config.json',
) {
  const json = JSON.stringify(cfg, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
