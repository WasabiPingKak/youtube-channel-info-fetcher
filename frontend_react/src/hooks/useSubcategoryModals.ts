import { useState } from 'react';

export const useSubcategoryModals = ({
  editableData,
  setEditableData,
  activeTab,
  setIsSaved,
}: {
  editableData: Record<string, Record<string, string[]>>;
  setEditableData: (data: any) => void;
  activeTab: string;
  setIsSaved: (val: boolean) => void;
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingName, setEditingName] = useState('');

  const existingNames = Object.keys(editableData?.[activeTab] || {});

  const handleAddSubcategory = (newName: string) => {
    const updated = {
      ...editableData[activeTab],
      [newName]: [],
    };
    setEditableData({
      ...editableData,
      [activeTab]: updated,
    });
    setIsSaved(false);
  };

  const handleRenameSubcategory = (oldName: string, newName: string) => {
    if (oldName === newName) return;

    const current = { ...editableData[activeTab] };
    const keywords = current[oldName];
    delete current[oldName];
    current[newName] = keywords;

    setEditableData({
      ...editableData,
      [activeTab]: current,
    });
    setIsSaved(false);
  };

  return {
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingName,
    setEditingName,
    existingNames,
    handleAddSubcategory,
    handleRenameSubcategory,
  };
};
