import React from 'react';
import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';
import type { Badge } from '@/types/video';
import { useQuickCategoryEditorStore } from '@/stores/useQuickCategoryEditorStore';
import VideoBadge from '@/components/common/VideoBadge';
import SubcategoryNameEditor from './SubcategoryNameEditor';
import KeywordMainCategoryControls from './KeywordMainCategoryControls';

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
  onCardFinished: _onCardFinished,
}) => {
  const applyAgree = useQuickCategoryEditorStore((s) => s.applyAgree);
  const removeAppliedKeyword = useQuickCategoryEditorStore((s) => s.removeAppliedKeyword);
  const setKeywordSkipped = useQuickCategoryEditorStore((s) => s.setKeywordSkipped);
  const setSubcategoryName = useQuickCategoryEditorStore((s) => s.setSubcategoryName);
  const toggleMainCategory = useQuickCategoryEditorStore((s) => s.toggleMainCategory);

  const badges =
    card.mainCategories.length > 0
      ? card.mainCategories.map((cat) => ({
        main: cat as Badge["main"],
        keyword: card.subcategoryName,
      }))
      : [{ main: '未分類' as const }];

  return (
    <div className="flex flex-col h-full justify-between text-gray-900 dark:text-gray-100">
      {/* 上半部內容 */}
      <div>
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
          isSaving={card.isSaving || false}
          isSuccess={card.isSuccess || false}
          onToggleMainCategory={toggleMainCategory}
          onAgree={() => applyAgree(card.keyword)}
          onRemoveAgree={() => removeAppliedKeyword(card.keyword)}
          onToggleSkip={setKeywordSkipped}
          onEditStart={() => setIsEditing(true)}
          onCardFinished={() => {}}
        />
      </div>
    </div>
  );
};

export default KeywordInfoPanel;
