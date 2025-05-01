import React from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useEditorStore } from '../hooks/useEditorStore';

/** 儲存按鈕 —— 會觸發後端重新分類 */
interface SaveAllButtonProps {
  /** 由父層 (EditorLayout) 傳入 disabled 狀態 */
  disabled: boolean;
}

export default function SaveAllButton({ disabled }: SaveAllButtonProps) {
  const channelId = useEditorStore((s) => s.channelId);
  const config = useEditorStore((s) => s.config);
  const markUnsaved = useEditorStore((s) => s.markUnsaved);
  const resetRemovedKeywords = useEditorStore(
    (s) => s.resetRemovedKeywords
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/categories/save-and-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          config,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message || 'Failed to save category settings'
        );
      }
    },
    onSuccess: () => {
      toast.success('✅ 已儲存並重新分類！');
      markUnsaved(false);
      resetRemovedKeywords();
    },
    onError: (err) => {
      toast.error(`❌ 儲存失敗：${(err as Error).message}`);
    },
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={disabled || mutation.isLoading}
      className={`px-4 py-1 rounded text-sm font-medium
        ${
          disabled || mutation.isLoading
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
    >
      {mutation.isLoading ? '儲存中…' : '全部儲存'}
    </button>
  );
}
