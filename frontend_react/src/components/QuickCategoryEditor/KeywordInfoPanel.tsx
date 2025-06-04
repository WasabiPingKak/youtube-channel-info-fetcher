import React from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';

const MAIN_CATEGORIES = ['雜談', '遊戲', '節目', '音樂'];

interface Props {
  card: SuggestedKeywordCardState;
  isEditing: boolean;
  editValue: string;
  setIsEditing: (v: boolean) => void;
  setEditValue: (v: string) => void;
}

const KeywordInfoPanel: React.FC<Props> = ({
  card,
  isEditing,
  editValue,
  setIsEditing,
  setEditValue,
}) => {
  const toggleAgree = useQuickCategoryEditorStore((s) => s.toggleAgree);
  const toggleSkip = useQuickCategoryEditorStore((s) => s.toggleSkip);
  const setSubcategoryName = useQuickCategoryEditorStore((s) => s.setSubcategoryName);
  const toggleMainCategory = useQuickCategoryEditorStore((s) => s.toggleMainCategory);

  const handleEditConfirm = () => {
    setSubcategoryName(card.keyword, editValue.trim());
    setIsEditing(false);
  };

  return (
    <>
      <div className={`text-lg font-semibold mb-2 ${card.skipped ? 'text-gray-500' : ''}`}>
        關鍵詞：「{card.keyword}」
      </div>

      <div className="mb-2">
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <input
              className="border rounded px-2 py-1 w-48"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={handleEditConfirm}
            >
              確認
            </button>
            <button
              className="text-sm text-gray-500 hover:underline"
              onClick={() => setIsEditing(false)}
            >
              取消
            </button>
          </div>
        ) : (
          <div className={`mb-2 ${card.skipped ? 'text-gray-500' : ''}`}>
            要顯示的分類名稱：{card.subcategoryName}
            {card.subcategoryName !== card.keyword && (
              <span className="text-sm text-gray-500 ml-2">
                （由「{card.keyword}」產生）
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-3 flex gap-2 flex-wrap">
        {MAIN_CATEGORIES.map((cat) => {
          const active = card.mainCategories.includes(cat);
          const disabled = card.skipped; // ⛔ 當跳過時禁用全部主分類
          return (
            <button
              key={cat}
              className={`px-3 py-1 rounded border flex items-center gap-1 transition ${active
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-100'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) toggleMainCategory(card.keyword, cat);
              }}
              disabled={disabled}
            >
              <input type="checkbox" readOnly checked={active} disabled={disabled} />
              {cat}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mb-2 items-center">
        <button
          className={`font-bold hover:underline transition ${card.mainCategories.length === 0
            ? 'text-gray-400 cursor-not-allowed opacity-50'
            : 'text-green-600'
            }`}
          title={card.mainCategories.length === 0 ? '請先選擇主分類' : ''}
          disabled={card.mainCategories.length === 0 || card.skipped}
          onClick={() => toggleAgree(card.keyword)}
        >
          ✔️ 同意
        </button>

        <button
          className={`text-blue-500 hover:underline ${card.skipped ? 'text-gray-400 cursor-not-allowed' : ''
            }`}
          disabled={card.skipped}
          onClick={() => setIsEditing(true)}
        >
          ✏️ 編輯要顯示的分類名稱
        </button>

        <button
          className={`text-red-500 hover:underline ${card.skipped ? '' : 'opacity-60'}`}
          onClick={() => toggleSkip(card.keyword)}
        >
          ❌ 跳過
        </button>
      </div>
    </>
  );
};

export default KeywordInfoPanel;
