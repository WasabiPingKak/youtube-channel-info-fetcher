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

  // ✅ 畫面邏輯：略過 → 收合；已套用 → 展開；初始 → 展開
  const shouldCollapse = isSkipped && !isAgreed;

  const bgColor = isSkipped
    ? 'bg-red-50 dark:bg-zinc-800'
    : isAgreed
      ? 'bg-green-50'
      : 'bg-white dark:bg-zinc-800';

  return (
    <div className={`border rounded-xl p-4 mb-4 shadow-sm ${bgColor}`}>
      {/* 標題列：顯示關鍵字與狀態 */}
      <div className="text-lg font-semibold flex flex-wrap items-center gap-2 mb-2">
        <span>關鍵詞：「{card.keyword}」</span>

        {isSkipped && (
          <>
            <span className="text-sm text-gray-500">(已略過)</span>
            <button
              className="text-sm text-blue-500 hover:underline"
              onClick={() => setKeywordSkipped(card.keyword, false)}
            >
              🔁 撤銷忽略狀態
            </button>
          </>
        )}

        {!isSkipped && isAgreed && (
          <span className="text-sm text-green-600">(已套用)</span>
        )}
      </div>

      {/* 若略過尚未套用：收合；其餘狀態展開 */}
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
            <KeywordVideoList card={card} showVideos={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordCard;
