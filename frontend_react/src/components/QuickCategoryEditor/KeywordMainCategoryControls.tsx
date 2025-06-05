import React from 'react';

const MAIN_CATEGORIES = ['雜談', '遊戲', '節目', '音樂'] as const;

interface Props {
  keyword: string;
  mainCategories: string[];
  skipped: boolean;

  onToggleMainCategory: (keyword: string, category: string) => void;
  onAgree: (keyword: string) => void;
  onSkip: (keyword: string) => void;
  onEditStart: () => void;

  onCardFinished?: (keyword: string, action: 'agreed' | 'skipped') => void;
}

const KeywordMainCategoryControls: React.FC<Props> = ({
  keyword,
  mainCategories,
  skipped,
  onToggleMainCategory,
  onAgree,
  onSkip,
  onEditStart,
  onCardFinished,
}) => {
  const handleAgree = () => {
    onAgree(keyword);
    onCardFinished?.(keyword, 'agreed');
  };

  const handleSkip = () => {
    onSkip(keyword);
    onCardFinished?.(keyword, 'skipped');
  };

  return (
    <>
      {/* 主分類選擇按鈕列 */}
      <div className="mb-3 flex gap-2 flex-wrap">
        {MAIN_CATEGORIES.map((cat) => {
          const active = mainCategories.includes(cat);
          const disabled = skipped;
          return (
            <button
              key={cat}
              className={`px-3 py-1 rounded border flex items-center gap-1 transition ${active
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-100'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) onToggleMainCategory(keyword, cat);
              }}
              disabled={disabled}
            >
              <input type="checkbox" readOnly checked={active} disabled={disabled} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* 操作按鈕列 */}
      <div className="flex gap-4 mb-2 items-center">
        <button
          className={`font-bold hover:underline transition ${mainCategories.length === 0
              ? 'text-gray-400 cursor-not-allowed opacity-50'
              : 'text-green-600'
            }`}
          title={mainCategories.length === 0 ? '請先選擇主分類' : ''}
          disabled={mainCategories.length === 0 || skipped}
          onClick={handleAgree}
        >
          ✔️ 同意
        </button>

        <button
          className={`text-blue-500 hover:underline ${skipped ? 'text-gray-400 cursor-not-allowed' : ''
            }`}
          disabled={skipped}
          onClick={onEditStart}
        >
          ✏️ 編輯要顯示的分類名稱
        </button>

        <button
          className={`text-red-500 hover:underline ${skipped ? '' : 'opacity-60'
            }`}
          onClick={handleSkip}
        >
          ❌ 跳過
        </button>
      </div>
    </>
  );
};

export default KeywordMainCategoryControls;
