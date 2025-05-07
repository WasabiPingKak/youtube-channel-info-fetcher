import React from 'react';
import { Plus } from 'lucide-react';

import GameModal from './GameModal';
import ConfirmModal from './ConfirmModal';
import GameTagTableRow from './GameTagTableRow';
import useGameTagLogic from '../hooks/useGameTagLogic';

/* ------------------------------------------------------------------
 * GameTagTable（封裝邏輯後的精簡版本）
 * ---------------------------------------------------------------- */
export default function GameTagTable() {
  const {
    games,
    selected,
    existingNames,
    /* 行為 */
    toggle,
    /* Modal 狀態與控制 */
    modalMode,
    editingGame,
    openAddModal,
    openEditModal,
    closeModal,
    handleSave,
    /* 刪除狀態與控制 */
    deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useGameTagLogic();

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm">
      {/* ---------- Header ---------- */}
      <header className="mb-2">
        <h3 className="font-semibold mb-2">🎮 遊戲標籤管理</h3>
        <p className="text-sm text-gray-500">
          根據目前已設定的遊戲關鍵字，反查有哪些遊戲名稱有命中影片標題。
        </p>
      </header>

      {/* ---------- Add Button ---------- */}
      <button
        className="mb-3 text-sm bg-gray-100 hover:bg-gray-200 rounded px-3 py-1 flex items-center gap-1"
        onClick={openAddModal}
      >
        <Plus size={16} />
        新增遊戲
      </button>

      {/* ---------- Table ---------- */}
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
            <GameTagTableRow
              key={g.game}
              entry={g}
              isSelected={selected.has(g.game)}
              onToggle={toggle}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
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

      {/* ---------- GameModal（新增 / 編輯） ---------- */}
      {modalMode && (
        <GameModal
          open
          initialGame={modalMode === 'edit' ? editingGame! : undefined}
          existingNames={existingNames}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {/* ---------- ConfirmModal（刪除確認） ---------- */}
      {!!deleteTarget && (
        <ConfirmModal
          open
          title={`確定刪除「${deleteTarget.game}」？`}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
}
