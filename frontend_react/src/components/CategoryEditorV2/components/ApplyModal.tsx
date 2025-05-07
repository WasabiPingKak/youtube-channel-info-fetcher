// components/ApplyModal.tsx
// --------------------------------------------------
// 套用 Badge 的對話框（複選主類別 → 批次套用或移除所有分類）
// 依 2025-05-05 規格：
//   • 只需要主類別複選，不處理遊戲名稱下拉
//   • 關鍵字來源 = activeKeywordFilter (目前選中 pill)
//   • 提供「確認套用」及「移除所有分類」功能
// --------------------------------------------------

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { MainCategory } from '../types/editor';
import { useEditorStore } from '../hooks/useEditorStore';

interface ApplyModalProps {
  onClose: () => void;
}

const selectableCategories: MainCategory[] = [
  '雜談',
  '節目',
  '音樂',
  '遊戲',
];

export default function ApplyModal({ onClose }: ApplyModalProps) {
  /** ===== Store ===== */
  const keyword = useEditorStore((s) => s.activeKeywordFilter);
  const applyBadges = useEditorStore((s) => s.applyBadges);
  const removeBadges = useEditorStore((s) => s.removeBadges);

  /** ===== Local State ===== */
  const [selectedCats, setSelectedCats] = useState<Set<MainCategory>>(new Set());

  /** 確認套用是否可用 */
  const isConfirmDisabled = selectedCats.size === 0 || !keyword;
  /** 移除所有分類是否可用 */
  const isRemoveDisabled = !keyword;

  /** 選中 / 取消主分類 */
  const toggleCategory = (cat: MainCategory) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  /** onConfirm：批次套用 Badge */
  const handleConfirm = () => {
    if (isConfirmDisabled || !keyword) return;
    applyBadges(keyword, [...selectedCats]);
    onClose();
  };

  /** onRemove：移除所有與此 keyword 相關的分類 */
  const handleRemoveAll = () => {
    if (isRemoveDisabled || !keyword) return;
    removeBadges(keyword);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>套用至分類</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {selectableCategories.map((cat) => (
            <label
              key={cat}
              className="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                checked={selectedCats.has(cat)}
                onChange={() => toggleCategory(cat)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={onClose} className="mr-2">
            取消
          </Button>
          <Button
            variant="destructive"
            disabled={isRemoveDisabled}
            onClick={handleRemoveAll}
            className="mx-2"
          >
            移除所有分類
          </Button>
          <Button
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
          >
            確認套用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}