import React from 'react';
import SubcategoryCard from './SubcategoryCard';

const SubcategoryListSection = ({
  subcategories,
  onNameChange,
  onKeywordsChange,
  onEdit,
  onDeleteSubcategory,
  videos = [],
}) => {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded shadow p-4 mb-4">
      {Object.entries(subcategories).length === 0 ? (
        <div className="text-gray-400 dark:text-gray-500 italic">尚未設定任何子分類</div>
      ) : (
        Object.entries(subcategories).map(([subcatName, keywords]) => (
          <SubcategoryCard
            key={subcatName}
            name={subcatName}
            keywords={keywords}
            onNameChange={(newName) => onNameChange(subcatName, newName)}
            onKeywordsChange={(kwList) => onKeywordsChange(subcatName, kwList)}
            onEdit={onEdit ? () => onEdit(subcatName) : undefined}
            onDelete={() => onDeleteSubcategory(subcatName)}
            videos={videos}
          />
        ))
      )}
    </div>
  );
};

export default SubcategoryListSection;
