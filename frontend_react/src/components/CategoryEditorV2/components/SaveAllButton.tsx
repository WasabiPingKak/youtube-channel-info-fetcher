import React from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useEditorStore } from '../hooks/useEditorStore';

interface SaveAllButtonProps {
  disabled: boolean;
}

export default function SaveAllButton({ disabled }: SaveAllButtonProps) {
  const channelId = useEditorStore((s) => s.channelId);
  const config = useEditorStore((s) => s.config);
  const setUnsaved = useEditorStore((s) => s.setUnsaved);
  const resetRemovedKeywords = useEditorStore(
    (s) => s.resetRemovedKeywords
  );

  /* ---------------- Mutation ---------------- */
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/categories/save-and-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, config }),
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
      setUnsaved(false);
      resetRemovedKeywords();
    },
    onError: (err) => {
      toast.error(`❌ 儲存失敗：${(err as Error).message}`);
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
