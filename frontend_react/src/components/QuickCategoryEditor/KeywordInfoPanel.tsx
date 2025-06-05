import React from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';
import VideoBadge from '@/components/common/VideoBadge'; // ✅ 新增匯入

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

  // ✅ 根據主分類產生 badge 資料
  const badges =
    card.mainCategories.length > 0
      ? card.mainCategories.map((cat) => ({
        main: cat,
        keyword: card.subcategoryName,
      }))
      : [{ main: '未分類' as const }];

  return (
    <div className="flex flex-col h-full justify-between">
      {/* 上半部內容 */}
      <div>
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
              <button
                className="text-sm text-orange-500 hover:underline"
                onClick={() => setEditValue(card.keyword)}
              >
                還原
              </button>
            </div>
          ) : (
            <div className={`mb-2 ${card.skipped ? 'text-gray-500' : ''}`}>
              {card.subcategoryName !== card.keyword && (
                <span className="text-sm text-gray-500 ml-2">
                  （標題過濾詞來自「{card.keyword}」）
                </span>
              )}
            </div>
          )}
        </div>

        {/* ✅ 插入 badge 顯示區塊 */}
        <div className="mb-3 flex gap-2 flex-wrap">
          {badges.map((badge, idx) => (
            <VideoBadge key={idx} badge={badge} />
          ))}
        </div>

        <div className="mb-3 flex gap-2 flex-wrap">
          {MAIN_CATEGORIES.map((cat) => {
            const active = card.mainCategories.includes(cat);
            const disabled = card.skipped;
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
            className={`text-red-500 hover:underline ${card.skipped ? '' : 'opacity-60'
              }`}
            onClick={() => toggleSkip(card.keyword)}
          >
            ❌ 跳過
          </button>
        </div>
      </div>

      {/* 💾 儲存設定 */}
      <div className="mt-4">
        <button
          className="bg-green-600 text-white px-6 py-2 rounded shadow"
          onClick={() => { }}
        >
          💾 儲存設定
        </button>
      </div>
    </div>
  );
};

export default KeywordInfoPanel;
