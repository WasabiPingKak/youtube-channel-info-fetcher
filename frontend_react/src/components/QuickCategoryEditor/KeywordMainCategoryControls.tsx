import React from 'react';

const MAIN_CATEGORIES = ['雜談', '遊戲', '節目', '音樂'] as const;

interface Props {
  keyword: string;
  mainCategories: string[];
  skipped: boolean;
  isSaving: boolean;
  isSuccess: boolean;

  onToggleMainCategory: (keyword: string, category: string) => void;
  onAgree: (keyword: string) => void;
  onRemoveAgree: (keyword: string) => void;
  onToggleSkip: (keyword: string, toSkipped: boolean) => void;
  onEditStart: () => void;

  onCardFinished?: (keyword: string, action: 'agreed' | 'skipped') => void;
}

const KeywordMainCategoryControls: React.FC<Props> = ({
  keyword,
  mainCategories,
  skipped,
  isSaving,
  isSuccess,
  onToggleMainCategory,
  onAgree,
  onRemoveAgree,
  onToggleSkip,
  onEditStart,
  onCardFinished,
}) => {
  const handleAgree = () => {
    onAgree(keyword);
    onCardFinished?.(keyword, 'agreed');
  };

  const handleToggleSkip = () => {
    const toSkipped = !skipped;
    onToggleSkip(keyword, toSkipped);
    onCardFinished?.(keyword, 'skipped');
  };

  const noCategorySelected = mainCategories.length === 0;
  const shouldShowError = noCategorySelected && !skipped && !isSuccess;

  const agreeButtonText = isSuccess
    ? '✔️ 已成功套用'
    : isSaving
      ? '儲存中...'
      : '✔️ 儲存此分類';

  const agreeButtonDisabled =
    skipped || noCategorySelected || isSaving || isSuccess;

  return (
    <>
      {/* 主分類選擇按鈕列 */}
      <div className="mb-3 flex gap-2 flex-wrap">
        {MAIN_CATEGORIES.map((cat) => {
          const active = mainCategories.includes(cat);
          const disabled = skipped || isSaving || isSuccess;
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

      {/* ⛔ 主分類錯誤提示 */}
      {shouldShowError && (
        <p className="text-red-500 text-sm mb-2">
          請選擇至少一個主分類才能繼續
        </p>
      )}

      {/* 操作按鈕列 */}
      <div className="flex gap-4 mb-2 items-center">
        <button
          className={`font-bold transition ${isSuccess
            ? 'bg-green-600 text-white px-3 py-1 rounded'
            : 'text-green-600 hover:underline'
            } ${agreeButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={shouldShowError ? '請先選擇主分類' : ''}
          disabled={agreeButtonDisabled}
          onClick={handleAgree}
        >
          {agreeButtonText}
        </button>

        <button
          className={`text-blue-500 hover:underline ${skipped || isSaving || isSuccess ? 'text-gray-400 cursor-not-allowed' : ''
            }`}
          disabled={skipped || isSaving || isSuccess}
          onClick={onEditStart}
        >
          ✏️ 編輯要顯示的分類名稱
        </button>

        <button
          className={`text-red-500 hover:underline ${isSaving || isSuccess ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          disabled={isSaving || isSuccess}
          onClick={handleToggleSkip}
        >
          {skipped ? '🔁 撤銷忽略狀態' : '❌ 忽略這個關鍵詞'}
        </button>

        {isSuccess && (
          <button
            className={`text-yellow-600 hover:underline ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            disabled={isSaving}
            onClick={() => onRemoveAgree(keyword)}
          >
            🗑 撤銷分類
          </button>
        )}
      </div>
    </>
  );
};

export default KeywordMainCategoryControls;
