// components/ApplyModal.tsx
// --------------------------------------------------
// 套用 Badge 的對話框（複選主類別 → 批次套用）
// 依 2025‑05‑05 規格：
//   • 只需要主類別複選，不處理遊戲名稱下拉
//   • 關鍵字來源 = activeKeywordFilter (目前選中 pill)
//   • 呼叫 useEditorStore.applyBadges(keyword, categories)
//   • 不傳 videoIds，邏輯由 store 內部自行篩選命中影片
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

  /** ===== Local State ===== */
  const [selectedCats, setSelectedCats] = useState<Set<MainCategory>>(new Set());

  /** 是否按鈕可用 */
  const isConfirmDisabled = selectedCats.size === 0 || !keyword;

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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>套用至分類</DialogTitle>
        </DialogHeader>

        {/* 主分類複選 */}
        <div className="space-y-2">
          {selectableCategories.map((cat) => (
            <label key={cat} className="flex items-center gap-2">
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
          <Button disabled={isConfirmDisabled} onClick={handleConfirm}>
            確認套用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
