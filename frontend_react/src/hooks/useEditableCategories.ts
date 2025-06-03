import { useEffect, useState } from 'react';

export const useEditableCategories = (
  categoryData: any,
  activeTab: string,
) => {
  const [editableData, setEditableData] = useState<Record<string, any>>({});
  const [newSubcatName, setNewSubcatName] = useState('');

  useEffect(() => {
    if (categoryData) {
      const cleaned = structuredClone(categoryData);

      for (const mainCategory of Object.keys(cleaned)) {
        const subcats = cleaned[mainCategory];
        for (const [subcatName, keywords] of Object.entries(subcats)) {
          if (!Array.isArray(keywords)) {
            console.warn(
              `[分類資料修正] ${mainCategory} → ${subcatName} 的關鍵字不是陣列，已自動轉換`,
              keywords
            );
            subcats[subcatName] = [String(keywords)];
          }
        }
      }

      setEditableData(cleaned);
    }
  }, [categoryData]);

  const subcategories = editableData?.[activeTab] || {};

  const onNameChange = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    const current = { ...subcategories };
    const keywords = current[oldName];
    delete current[oldName];
    current[newName] = keywords;
    setEditableData({ ...editableData, [activeTab]: current });
  };

  const onKeywordsChange = (subcatName: string, newKeywords: string[]) => {
    const current = { ...subcategories };
    current[subcatName] = newKeywords;
    setEditableData({ ...editableData, [activeTab]: current });
  };

  const onDeleteSubcategory = (subcatName: string) => {
    const current = { ...subcategories };
    delete current[subcatName];
    setEditableData({ ...editableData, [activeTab]: current });
  };

  const onAddSubcategory = () => {
    const name = newSubcatName.trim();
    if (!name || subcategories[name]) return;
    const current = { ...subcategories };
    current[name] = [name];
    setEditableData({ ...editableData, [activeTab]: current });
    setNewSubcatName('');
  };

  return {
    editableData,
    setEditableData,
    subcategories,
    onNameChange,
    onKeywordsChange,
    onDeleteSubcategory,
    onAddSubcategory,
    newSubcatName,
    setNewSubcatName,
  };
};
