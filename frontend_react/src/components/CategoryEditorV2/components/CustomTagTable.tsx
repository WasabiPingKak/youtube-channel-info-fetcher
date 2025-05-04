import React, { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useEditorStore } from '../hooks/useEditorStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------
 * Modal：新增 / 編輯 自訂關鍵字
 * ---------------------------------------------------------------- */
interface KeywordModalProps {
  open: boolean;
  initialKeyword?: string;
  existingKeywords: Set<string>;
  onClose: () => void;
  onSave: (keyword: string) => void;
}

function KeywordModal({ open, initialKeyword, existingKeywords, onClose, onSave }: KeywordModalProps) {
  const [text, setText] = useState(initialKeyword ?? '');
  const hasConflict = !initialKeyword && existingKeywords.has(text.trim());

  const handleSave = () => {
    if (!text.trim() || hasConflict) return;
    onSave(text.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initialKeyword ? '編輯關鍵字' : '新增關鍵字'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">關鍵字</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {hasConflict && <p className="text-xs text-red-600 mt-0.5">關鍵字已存在</p>}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button disabled={!text.trim() || hasConflict} onClick={handleSave}>
            {initialKeyword ? '更新' : '新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
 * Modal：刪除確認
 * ---------------------------------------------------------------- */
interface ConfirmModalProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ open, title, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogFooter className="justify-center gap-4">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="destructive" onClick={onConfirm}>刪除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
 * CustomTagTable 元件
 * ---------------------------------------------------------------- */
export default function CustomTagTable() {
  const keywords = useEditorStore((s) => s.customKeywords);
  const setKeywords = useEditorStore((s) => s.setCustomKeywords);
  const selected = useEditorStore((s) => s.selectedBySource.custom);
  const toggleChecked = useEditorStore((s) => s.toggleSuggestionChecked);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const existingSet = new Set(keywords);

  const saveKeyword = (value: string, oldValue?: string) => {
    let newList = [...keywords];
    if (oldValue) {
      newList = newList.map((k) => (k === oldValue ? value : k));
    } else {
      newList.push(value);
    }
    setKeywords(newList);
  };

  const deleteKeyword = (value: string) => {
    setKeywords(keywords.filter((k) => k !== value));
  };

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm mt-6">
      <header className="mb-2">
        <h3 className="font-semibold mb-2">✍️ 自訂關鍵字</h3>
        <p className="text-sm text-gray-500">手動新增分類關鍵字（自訂）</p>
      </header>
      <button
        className="mb-3 text-sm bg-gray-100 hover:bg-gray-200 rounded px-3 py-1 flex items-center gap-1"
        onClick={() => {
          setModalMode('add');
          setEditingKeyword(null);
        }}
      >
        <Plus size={16} /> 新增關鍵字
      </button>

      <table className="w-full border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-sm">
            <th className="px-2 py-1 text-left border-b border-gray-300">啟用</th>
            <th className="px-2 py-1 text-left border-b border-gray-300">關鍵字</th>
            <th className="px-2 py-1 w-14 border-b border-gray-300">操作</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((k) => (
            <tr key={k} className="border-b">
              <td className="px-2 py-1 border-t border-gray-200">
                <input
                  type="checkbox"
                  checked={selected.has(k)}
                  onChange={() => toggleChecked('custom', k)}
                />
              </td>
              <td className="px-2 py-1 border-t border-gray-200">{k}</td>
              <td className="px-2 py-1 border-t border-gray-200 flex gap-2">
                <button onClick={() => {
                  setModalMode('edit');
                  setEditingKeyword(k);
                }}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => setDeleteTarget(k)}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {keywords.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center py-6 text-gray-400 border-t">
                尚未新增任何關鍵字
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal 控制區 */}
      {modalMode && (
        <KeywordModal
          open
          initialKeyword={modalMode === 'edit' ? editingKeyword! : undefined}
          existingKeywords={existingSet}
          onClose={() => setModalMode(null)}
          onSave={(kw) => saveKeyword(kw, modalMode === 'edit' ? editingKeyword! : undefined)}
        />
      )}

      {!!deleteTarget && (
        <ConfirmModal
          open
          title={`確定刪除「${deleteTarget}」？`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteKeyword(deleteTarget);
            setDeleteTarget(null);
          }}
        />
      )}
    </section>
  );
}
