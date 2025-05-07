// components/SaveAllButton.tsx
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useEditorStore } from '../hooks/useEditorStore';

interface SaveAllButtonProps {
  disabled: boolean;
}

export default function SaveAllButton({ disabled }: SaveAllButtonProps) {
  const BASE_URL = import.meta.env.VITE_API_BASE || '';

  const mutation = useMutation({
    mutationFn: async () => {
      // ✅ 使用 getFullMergedConfig() 匯出完整設定
      const channelId = useEditorStore.getState().channelId;
      const config = useEditorStore.getState().getFullMergedConfig();

      const res = await fetch(`${BASE_URL}/api/categories/save-and-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, settings: config }),
      });

      const data = await res.json();
      if (!res.ok || data.success !== true) {
        throw new Error(data.message || '儲存失敗');
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(`設定已儲存，成功套用 ${data.updated_count} 筆分類！`);
      useEditorStore.getState().setUnsaved(false);
      useEditorStore.getState().resetRemovedKeywords();
    },
    onError: (err) => {
      toast.error(`儲存失敗：${(err as Error).message}`);
    },
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={disabled || mutation.isPending}
      className={`px-4 py-1 rounded text-sm font-medium ${
        disabled || mutation.isPending
          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
    >
      {mutation.isPending ? '儲存中…' : '全部儲存'}
    </button>
  );
}
