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
 * GameTagTable（已整合 checkbox 勾選）
 * ---------------------------------------------------------------- */
export default function GameTagTable() {
  const activeType = useEditorStore((s) => s.activeType);
  const config = useEditorStore((s) => s.config);
  const updateConfigOfType = useEditorStore((s) => s.updateConfigOfType);
  const markUnsaved = useEditorStore((s) => s.markUnsaved);

  const games: GameEntry[] = config?.[activeType]?.遊戲 ?? [];
  const selected = useEditorStore((s) => s.selectedBySource.game);
  const toggleSuggestionChecked = useEditorStore((s) => s.toggleSuggestionChecked);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingGame, setEditingGame] = useState<GameEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GameEntry | null>(null);

  const existingNames = new Set<string>(games.map((g) => g.game));

  const saveGameEntry = (entry: GameEntry, replaceOld?: string) => {
    const oldSettings: CategorySettings = config[activeType] ?? {};
    const newGameList: GameEntry[] = replaceOld
      ? games.map((g) => (g.game === replaceOld ? entry : g))
      : [...games, entry];

    updateConfigOfType(activeType as VideoType, {
      ...oldSettings,
      遊戲: newGameList,
    });
    markUnsaved();
  };

  const deleteGameEntry = (name: string) => {
    const oldSettings: CategorySettings = config[activeType] ?? {};
    updateConfigOfType(activeType as VideoType, {
      ...oldSettings,
      遊戲: games.filter((g) => g.game !== name),
    });
    markUnsaved();
  };

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm">
      <header className="mb-2">
        <h3 className="font-semibold mb-2">🎮 遊戲標籤管理</h3>
        <p className="text-sm text-gray-500">
          根據目前已設定的遊戲關鍵字，反查有哪些遊戲名稱有命中影片標題。
        </p>
      </header>
      <button
        className="mb-3 text-sm bg-gray-100 hover:bg-gray-200 rounded px-3 py-1 flex items-center gap-1"
        onClick={() => {
          setModalMode('add');
          setEditingGame(null);
        }}
      >
        <Plus size={16} />
        新增遊戲
      </button>

      <table className="w-full border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-sm">
            <th className="px-2 py-1 text-left border-b border-gray-300">啟用</th>
            <th className="px-2 py-1 text-left border-b border-gray-300">遊戲名稱</th>
            <th className="px-2 py-1 text-left border-b border-gray-300">關鍵字</th>
            <th className="px-2 py-1 w-14 border-b border-gray-300">操作</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.game} className="border-b">
              <td className="px-2 py-1 align-top border-t border-gray-200">
                <input
                  type="checkbox"
                  checked={selected.has(g.game)}
                  onChange={() => toggleSuggestionChecked('game', g.game)}
                />
              </td>
              <td className="px-2 py-1 align-top border-t border-gray-200">{g.game}</td>
              <td className="px-2 py-1 align-top border-t border-gray-200">{g.keywords.join(', ')}</td>
              <td className="px-2 py-1 align-top border-t border-gray-200 flex gap-2">
                <button onClick={() => {
                  setModalMode('edit');
                  setEditingGame(g);
                }}>
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
              <td colSpan={4} className="text-center py-6 text-gray-400 border-t">
                尚未新增任何遊戲
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 新增 / 編輯 Modal */}
      {modalMode && (
        <GameModal
          open
          initialGame={modalMode === 'edit' ? editingGame! : undefined}
          existingNames={existingNames}
          onClose={() => setModalMode(null)}
          onSave={(entry) =>
            saveGameEntry(entry, modalMode === 'edit' ? editingGame!.game : undefined)
          }
        />
      )}

      {/* 刪除確認 Modal */}
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
