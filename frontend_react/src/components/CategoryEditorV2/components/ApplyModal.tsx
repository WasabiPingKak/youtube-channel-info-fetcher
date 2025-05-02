import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import {
  MainCategory,
  Video,
  GameEntry,
} from '../types/editor';
import { useEditorStore } from '../hooks/useEditorStore';

interface ApplyModalProps {
  /** 使用者勾選的影片 ID */
  videoIds: string[];
  onClose: () => void;
}

const selectableCategories: MainCategory[] = [
  '雜談',
  '節目',
  '音樂',
  '遊戲',
];

export default function ApplyModal({
  videoIds,
  onClose,
}: ApplyModalProps) {
  /** ===== Store ===== */
  const activeType = useEditorStore((s) => s.activeType);
  const videos = useEditorStore((s) => s.videos);
  const setVideos = useEditorStore((s) => s.setVideos);
  const config = useEditorStore((s) => s.config);
  const markUnsaved = useEditorStore((s) => s.markUnsaved);

  /** ===== Local State ===== */
  const [selectedCats, setSelectedCats] = useState<Set<MainCategory>>(new Set());
  const [selectedGame, setSelectedGame] = useState<string>('');

  /** 遊戲清單（依 activeType 取設定） */
  const gameOptions: GameEntry[] = useMemo(
    () => config?.[activeType]?.遊戲 ?? [],
    [config, activeType]
  );

  /** 是否按鈕可用 */
  const isConfirmDisabled =
    selectedCats.size === 0 ||
    (selectedCats.has('遊戲') && !selectedGame);

  /** 選中 / 取消主分類 */
  const toggleCategory = (cat: MainCategory) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      if (!next.has('遊戲')) setSelectedGame('');
      return next;
    });
  };

  /** onConfirm：更新 Store */
  const handleConfirm = () => {
    if (isConfirmDisabled) return;

    const catArray = [...selectedCats].filter((cat) => cat !== '其他');

    const updated = videos.map((v: Video) => {
      if (!videoIds.includes(v.videoId)) return v;

      const newVid: Video = {
        ...v,
        matchedCategories: catArray,
      };

      if (catArray.includes('遊戲')) {
        newVid.gameName = selectedGame;
      } else {
        delete newVid.gameName;
      }

      return newVid;
    });

    setVideos(updated);
    markUnsaved();
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

        {/* 遊戲下拉 */}
        {selectedCats.has('遊戲') && (
          <div className="mt-4">
            <label className="block text-sm mb-1">選擇遊戲名稱：</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              <option value="">-- 請選擇 --</option>
              {gameOptions.map((g) => (
                <option key={g.game} value={g.game}>
                  {g.game}
                </option>
              ))}
            </select>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            className="mr-2"
          >
            取消
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
