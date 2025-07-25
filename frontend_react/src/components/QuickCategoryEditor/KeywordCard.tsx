import React, { useState } from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import KeywordInfoPanel from './KeywordInfoPanel';
import KeywordVideoList from './KeywordVideoList';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';

interface Props {
  card: SuggestedKeywordCardState;
}

const KeywordCard: React.FC<Props> = ({ card }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.subcategoryName);

  const setKeywordSkipped = useQuickCategoryEditorStore((s) => s.setKeywordSkipped);

  const isSkipped = card.skipped;
  const isAgreed = card.agreed;

  // ✅ 略過但尚未分類 → 收合；已分類或未略過 → 展開
  const shouldCollapse = isSkipped && !isAgreed;

  // 🌗 使用更明顯的背景色表示卡片狀態
  const bgColor = isSkipped
    ? 'bg-red-50 dark:bg-red-500/10'
    : isAgreed
      ? 'bg-green-50 dark:bg-green-500/10'
      : 'bg-white dark:bg-zinc-800';

  return (
    <div className={`border border-gray-300 dark:border-zinc-600 rounded-xl p-4 mb-4 shadow-sm ${bgColor}`}>
      {/* 標題列 */}
      <div className="text-lg font-semibold flex flex-wrap items-center gap-2 mb-2 text-gray-900 dark:text-gray-100">
        <span>關鍵詞：「{card.keyword}」</span>

        {isSkipped && (
          <>
            <span className="text-sm text-gray-500 dark:text-gray-400">(已略過)</span>
            <button
              className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
              onClick={() => setKeywordSkipped(card.keyword, false)}
            >
              🔁 撤銷忽略狀態
            </button>
          </>
        )}

        {!isSkipped && isAgreed && (
          <span className="text-sm text-green-600 dark:text-green-400">(已套用)</span>
        )}
      </div>

      {/* 主體區塊 */}
      {!shouldCollapse && (
        <div className="md:flex md:gap-6">
          <div className="md:w-1/2">
            <KeywordInfoPanel
              card={card}
              isEditing={isEditing}
              editValue={editValue}
              setIsEditing={setIsEditing}
              setEditValue={setEditValue}
              onCardFinished={() => { }}
            />
          </div>
          <div className="md:w-1/2 mt-4 md:mt-0">
            {card.matchedVideos.length > 0 ? (
              <KeywordVideoList card={card} showVideos={true} />
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                目前無命中影片（可能已分類完畢或影片已刪除）
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordCard;
