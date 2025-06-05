import React from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';
import VideoBadge from '@/components/common/VideoBadge';
import SubcategoryNameEditor from './SubcategoryNameEditor';
import KeywordMainCategoryControls from './KeywordMainCategoryControls';

const MAIN_CATEGORIES = ['雜談', '遊戲', '節目', '音樂'];

interface Props {
  card: SuggestedKeywordCardState;
  isEditing: boolean;
  editValue: string;
  setIsEditing: (v: boolean) => void;
  setEditValue: (v: string) => void;
  onCardFinished?: (keyword: string, action: 'agreed' | 'skipped') => void;
}

const KeywordInfoPanel: React.FC<Props> = ({
  card,
  isEditing,
  editValue,
  setIsEditing,
  setEditValue,
  onCardFinished,
}) => {
  const toggleAgree = useQuickCategoryEditorStore((s) => s.toggleAgree);
  const setKeywordSkipped = useQuickCategoryEditorStore((s) => s.setKeywordSkipped);
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

        <SubcategoryNameEditor
          keyword={card.keyword}
          subcategoryName={card.subcategoryName}
          isEditing={isEditing}
          editValue={editValue}
          setEditValue={setEditValue}
          setIsEditing={setIsEditing}
          onConfirm={(value) => {
            setSubcategoryName(card.keyword, value.trim());
            setIsEditing(false);
          }}
          skipped={card.skipped}
        />

        {/* ✅ 插入 badge 顯示區塊 */}
        <div className="mb-3 flex gap-2 flex-wrap">
          {badges.map((badge, idx) => (
            <VideoBadge key={idx} badge={badge} />
          ))}
        </div>

        <KeywordMainCategoryControls
          keyword={card.keyword}
          mainCategories={card.mainCategories}
          skipped={card.skipped}
          onToggleMainCategory={toggleMainCategory}
          onAgree={toggleAgree}
          onToggleSkip={setKeywordSkipped}
          onEditStart={() => setIsEditing(true)}
          onCardFinished={(keyword, action) => {
            console.log(`${keyword} 被 ${action}，可通知 KeywordCard 收合`);
            // ⬆️ 未來可從這裡觸發父層移除卡片或動畫
          }}
        />
      </div>
    </div>
  );
};

export default KeywordInfoPanel;
