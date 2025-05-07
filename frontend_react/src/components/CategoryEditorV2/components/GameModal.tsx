import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GameEntry } from "../types/editor";

export interface GameModalProps {
  open: boolean;
  initialGame?: GameEntry;
  existingNames: Set<string>;
  onClose: () => void;
  onSave: (entry: GameEntry) => void;
}

export default function GameModal({
  open,
  initialGame,
  existingNames,
  onClose,
  onSave,
}: GameModalProps) {
  const [name, setName] = useState(initialGame?.game ?? "");
  const [keywords, setKeywords] = useState(
    initialGame?.keywords.join(", ") ?? ""
  );

  useEffect(() => {
    if (open) {
      setName(initialGame?.game ?? "");
      setKeywords(initialGame?.keywords.join(", ") ?? "");
    }
  }, [initialGame, open]);

  const trimmedName = name.trim();
  const keywordList = keywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const hasNameConflict =
    trimmedName !== (initialGame?.game ?? "") &&
    existingNames.has(trimmedName);

  const handleSave = () => {
    if (!trimmedName || hasNameConflict) return;
    onSave({ game: trimmedName, keywords: keywordList });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialGame ? "編輯遊戲" : "新增遊戲"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">遊戲名稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {hasNameConflict && (
              <p className="text-red-500 text-sm mt-1">
                此名稱已存在，請使用其他名稱。
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">
              關鍵字 (以逗號分隔)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!trimmedName || hasNameConflict}>
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
