import React, { useState } from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import KeywordInfoPanel from './KeywordInfoPanel';
import KeywordVideoList from './KeywordVideoList';

interface Props {
  card: SuggestedKeywordCardState;
}

const KeywordCard: React.FC<Props> = ({ card }) => {
  const [showVideos] = useState(true); // 預設展開
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.subcategoryName);

  return (
    <div className={`border rounded-xl p-4 mb-4 shadow-sm
      ${card.agreed ? 'bg-green-50' : card.skipped ? 'bg-red-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-800'}`
    }>
      <div className="md:flex md:gap-6">
        <div className="md:w-1/2">
          <KeywordInfoPanel
            card={card}
            isEditing={isEditing}
            editValue={editValue}
            setIsEditing={setIsEditing}
            setEditValue={setEditValue}
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
