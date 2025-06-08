const API_BASE = import.meta.env.VITE_API_BASE || "";

export type QuickApplyTarget = {
  mainCategory: string;
  subcategoryName: string;
};

/**
 * 提供快速分類 API 呼叫函式
 *
 * @returns applyQuickCategory(channelId, keyword, targets[])
 */
export function useQuickCategoryApply() {
  const applyQuickCategory = async (
    channelId: string,
    keyword: string,
    targets: QuickApplyTarget[]
  ) => {
    const url = `${API_BASE}/api/quick-editor/channel-config-apply`;
    const payload = { channelId, keyword, targets };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`API 錯誤：${res.status}`);
    }

    const result = await res.json();
    if (result.status !== 'success') {
      throw new Error(result.message || '快速分類儲存失敗');
    }

    return result;
  };

  return applyQuickCategory;
}
