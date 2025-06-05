import React, { useState } from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import KeywordInfoPanel from './KeywordInfoPanel';
import KeywordVideoList from './KeywordVideoList';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';

interface Props {
  card: SuggestedKeywordCardState;
}

const KeywordCard: React.FC<Props> = ({ card }) => {
  const [showVideos] = useState(true); // 預設展開
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.subcategoryName);

  const setKeywordSkipped = useQuickCategoryEditorStore((s) => s.setKeywordSkipped);

  // ✅ 控制卡片是否收合
  if (card.skipped) {
    return (
      <div className="border rounded-xl p-4 mb-4 shadow-sm bg-red-50 dark:bg-zinc-800">
        <div className="text-lg font-semibold flex flex-wrap items-center gap-2">
          <span>關鍵詞：「{card.keyword}」</span>
          <span className="text-sm text-gray-500">(已略過)</span>
          <button
            className="text-sm text-blue-500 hover:underline"
            onClick={() => {
              setKeywordSkipped(card.keyword, false);
            }}
          >
            🔁 撤銷忽略狀態
          </button>
        </div>
      </div>
    );
  }

  // ✅ 正常展開狀態
  return (
    <div className={`border rounded-xl p-4 mb-4 shadow-sm
      ${card.skipped ? 'bg-red-50 dark:bg-zinc-800' :
        card.agreed ? 'bg-green-50' : 'bg-white dark:bg-zinc-800'}`
    }>
      <div className="md:flex md:gap-6">
        <div className="md:w-1/2">
          <KeywordInfoPanel
            card={card}
            isEditing={isEditing}
            editValue={editValue}
            setIsEditing={setIsEditing}
            setEditValue={setEditValue}
            onCardFinished={() => {
            }}
          />
        </div>
        <div className="md:w-1/2 mt-4 md:mt-0">
          <KeywordVideoList card={card} showVideos={showVideos} />
        </div>
      </div>
    </div>
  );
};

export default KeywordCard;
