import React, { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';

import { useEditorStore } from '../hooks/useEditorStore';
import {
  GameEntry,
  CategorySettings,
  VideoType,
} from '../types/editor';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------
 * Reusable Modal (新增 / 編輯)
 * ---------------------------------------------------------------- */
interface GameModalProps {
  open: boolean;
  initialGame?: GameEntry;
  existingNames: Set<string>;
  onClose: () => void;
  onSave: (entry: GameEntry) => void;
}

function GameModal({
  open,
  initialGame,
  existingNames,
  onClose,
  onSave,
}: GameModalProps) {
  const [name, setName] = useState(initialGame?.game ?? '');
  const [keywords, setKeywords] = useState(
    (initialGame?.keywords ?? []).join(', ')
  );

  const hasNameConflict =
    !initialGame && existingNames.has(name.trim());

  const handleSave = () => {
    if (!name.trim() || hasNameConflict) return;
    const entry: GameEntry = {
      game: name.trim(),
      keywords: keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    };
    onSave(entry);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialGame ? '編輯遊戲' : '新增遊戲'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">遊戲名稱</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {hasNameConflict && (
              <p className="text-xs text-red-600 mt-0.5">名稱已存在</p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">
              關鍵字（以逗號分隔）
            </label>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm"
              rows={3}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={!name.trim() || hasNameConflict}
            onClick={handleSave}
          >
            {initialGame ? '更新' : '新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
 * Confirm Delete Modal
 * ---------------------------------------------------------------- */
interface ConfirmModalProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({
  open,
  title,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogFooter className="justify-center gap-4">
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            刪除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
 * GameTagTable
 * ---------------------------------------------------------------- */
export default function GameTagTable() {
  /** ===== Store ===== */
  const activeType = useEditorStore((s) => s.activeType);
  const config = useEditorStore((s) => s.config);
  const updateConfigOfType = useEditorStore(
    (s) => s.updateConfigOfType
  );
  const markUnsaved = useEditorStore((s) => s.markUnsaved);

  // 安全取得遊戲清單，若不存在則給空陣列
  const games: GameEntry[] =
    config?.[activeType]?.遊戲 ?? [];

  /** ===== Local Modal State ===== */
  const [modalMode, setModalMode] = useState<
    'add' | 'edit' | null
  >(null);
  const [editingGame, setEditingGame] = useState<GameEntry | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<GameEntry | null>(
    null
  );

  /** ===== Helpers ===== */
  const existingNames = new Set<string>(games.map((g) => g.game));

  const saveGameEntry = (entry: GameEntry, replaceOld?: string) => {
    const oldSettings: CategorySettings =
      config[activeType] ?? {};

    const newGameList: GameEntry[] = replaceOld
      ? games.map((g) => (g.game === replaceOld ? entry : g))
      : [...games, entry];

    const newSettings: CategorySettings = {
      ...oldSettings,
      遊戲: newGameList,
    };

    updateConfigOfType(activeType as VideoType, newSettings);
    markUnsaved();
  };

  const deleteGameEntry = (name: string) => {
    const oldSettings: CategorySettings =
      config[activeType] ?? {};

    const newSettings: CategorySettings = {
      ...oldSettings,
      遊戲: games.filter((g) => g.game !== name),
    };

    updateConfigOfType(activeType as VideoType, newSettings);
    markUnsaved();
  };

  /** ===== Render ===== */
  return (
    <section className="border p-3 rounded-lg">
      <header className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">🎮 遊戲標籤管理</h3>
        <button
          className="text-green-600 flex items-center gap-1 text-sm"
          onClick={() => {
            setModalMode('add');
            setEditingGame(null);
          }}
        >
          <Plus size={16} />
          新增
        </button>
      </header>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="px-2 py-1 text-left">遊戲名稱</th>
            <th className="px-2 py-1 text-left">關鍵字</th>
            <th className="px-2 py-1 w-14">操作</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr
              key={g.game}
              className="border-b dark:border-gray-600"
            >
              <td className="px-2 py-1">{g.game}</td>
              <td className="px-2 py-1">
                {g.keywords.join(', ')}
              </td>
              <td className="px-2 py-1 flex gap-2">
                <button
                  onClick={() => {
                    setModalMode('edit');
                    setEditingGame(g);
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button onClick={() => setDeleteTarget(g)}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {games.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="text-center py-4 text-gray-400"
              >
                尚未新增任何遊戲
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== 新增 / 編輯 Modal ===== */}
      {modalMode && (
        <GameModal
          open
          initialGame={modalMode === 'edit' ? editingGame! : undefined}
          existingNames={existingNames}
          onClose={() => setModalMode(null)}
          onSave={(entry) =>
            saveGameEntry(
              entry,
              modalMode === 'edit' ? editingGame!.game : undefined
            )
          }
        />
      )}

      {/* ===== 刪除確認 ===== */}
      {!!deleteTarget && (
        <ConfirmModal
          open
          title={`確定刪除「${deleteTarget.game}」？`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteGameEntry(deleteTarget.game);
            setDeleteTarget(null);
          }}
        />
      )}
    </section>
  );
}
