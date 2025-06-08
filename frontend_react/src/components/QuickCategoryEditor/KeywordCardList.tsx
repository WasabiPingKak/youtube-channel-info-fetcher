import React from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import KeywordCard from './KeywordCard';

interface Props {
  cards: SuggestedKeywordCardState[];
}

const KeywordCardList: React.FC<Props> = ({ cards }) => {
  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
        🎯 系統已無法提供更進一步的分類建議。<br />
        部分影片標題可能風格較特殊，建議前往完整分類編輯器進行微調。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <KeywordCard key={card.keyword} card={card} />
      ))}
    </div>
  );
};

export default KeywordCardList;
