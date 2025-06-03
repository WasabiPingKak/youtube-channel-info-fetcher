import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

import { useCategoryConfig } from '../hooks/useCategoryConfig';
import { useEditableCategories } from '../hooks/useEditableCategories';
import { useClassifiedVideos } from '../hooks/useClassifiedVideos';

import UnclassifiedVideosPreview from '../components/ChannelCategoryEditor/UnclassifiedVideosPreview';
import SubcategoryListSection from '../components/ChannelCategoryEditor/SubcategoryListSection';
import SubcategoryEditorModal from '../components/ChannelCategoryEditor/SubcategoryEditorModal';

const FIXED_TABS = ['雜談', '遊戲', '節目', '音樂'];

const ChannelCategoryEditorPage = () => {
  const { data: categoryData, isLoading, isError } = useCategoryConfig();
  const [activeTab, setActiveTab] = useState('雜談');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingName, setEditingName] = useState('');

  const {
    editableData,
    setEditableData,
    subcategories,
    onNameChange,
    onKeywordsChange,
    onDeleteSubcategory,
  } = useEditableCategories(categoryData, activeTab);

  const {
    videos,
    loading: videoLoading,
    error: videoError,
  } = useClassifiedVideos('UCLxa0YOtqi8IR5r2dSLXPng');

  const existingNames = Object.keys(editableData?.[activeTab] || {});

  const handleAddSubcategory = (newName) => {
    const updated = {
      ...editableData[activeTab],
      [newName]: [],
    };
    setEditableData({
      ...editableData,
      [activeTab]: updated,
    });
  };

  const handleRenameSubcategory = (oldName, newName) => {
    if (oldName === newName) return;

    const current = { ...editableData[activeTab] };
    const keywords = current[oldName];
    delete current[oldName];
    current[newName] = keywords;

    setEditableData({
      ...editableData,
      [activeTab]: current,
    });
  };

  if (isLoading) return <div>🔄 載入分類資料中...</div>;
  if (isError || !categoryData) return <div>❌ 無法載入分類資料。</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">頻道自訂分類編輯器</h1>
      <p className="text-sm text-gray-600 mb-4">
        本頁面所做的分類設定只會套用在你自己的頻道中，其他人無法共用你的設定。
      </p>
      {/* Tabs */}
      <div className="flex gap-3 mb-4">
        {FIXED_TABS.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded ${tab === activeTab ? 'bg-gray-800 text-white' : 'bg-gray-200'
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <SubcategoryListSection
        subcategories={subcategories}
        onNameChange={onNameChange}
        onKeywordsChange={onKeywordsChange}
        onDeleteSubcategory={onDeleteSubcategory}
        videos={videos}
        onEdit={(name) => {
          setEditingName(name);
          setIsEditModalOpen(true);
        }}
      />

      {/* ➕ 新增子分類 */}
      <div className="flex justify-end mb-8">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setIsAddModalOpen(true)}
        >
          ➕ 新增子分類
        </button>
      </div>

      {/* 💾 儲存設定 */}
      <div className="flex justify-end">
        <button
          className="bg-green-600 text-white px-6 py-2 rounded shadow"
          onClick={async () => {
            try {
              const configRef = doc(
                db,
                'channel_data',
                'UCLxa0YOtqi8IR5r2dSLXPng',
                'settings',
                'config'
              );
              await setDoc(configRef, editableData);
              toast.success('✅ 已儲存分類設定');
            } catch (err) {
              console.error('[儲存分類設定失敗]', err);
              toast.error('❌ 儲存失敗，請稍後再試');
            }
          }}
        >
          💾 儲存設定
        </button>
      </div>

      {/* 📺 未分類影片 */}
      {videoLoading ? (
        <div className="mt-6 text-sm text-gray-500">載入未分類影片中...</div>
      ) : videoError ? (
        <div className="mt-6 text-sm text-red-500">載入失敗，請稍後再試。</div>
      ) : (
        <UnclassifiedVideosPreview videos={videos} />
      )}

      {/* ➕ 新增子分類 modal */}
      <SubcategoryEditorModal
        title="新增子分類"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRename={(_, newName) => handleAddSubcategory(newName)}
        existingNames={existingNames}
        videos={videos}
      />

      {/* ✏️ 編輯子分類 modal */}
      <SubcategoryEditorModal
        title="編輯子分類"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onRename={handleRenameSubcategory}
        originalName={editingName}
        existingNames={existingNames.filter((n) => n !== editingName)}
        videos={videos}
      />
    </div>
  );
};

export default ChannelCategoryEditorPage;
