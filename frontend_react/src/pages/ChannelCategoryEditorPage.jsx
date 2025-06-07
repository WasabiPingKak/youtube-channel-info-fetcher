import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import isEqual from 'lodash.isequal';

import { useMyChannelId } from '@/hooks/useMyChannelId';
import { useCategoryConfig } from '../hooks/useCategoryConfig';
import { useEditableCategories } from '../hooks/useEditableCategories';
import { useClassifiedVideos } from '../hooks/useClassifiedVideos';
import MainLayout from "../components/layout/MainLayout";
import { showSuccessToast, showFailureToast, showLoginRequiredToast, showPermissionDeniedToast } from "@/components/common/ToastManager";

import UnclassifiedVideosPreview from '../components/ChannelCategoryEditor/UnclassifiedVideosPreview';
import SubcategoryListSection from '../components/ChannelCategoryEditor/SubcategoryListSection';
import SubcategoryEditorModal from '../components/ChannelCategoryEditor/SubcategoryEditorModal';
import DiscardChangesDialog from '../components/ChannelCategoryEditor/DiscardChangesDialog';

const FIXED_TABS = ['雜談', '遊戲', '節目', '音樂'];

const ChannelCategoryEditorPage = () => {
  const navigate = useNavigate();

  // 1. hooks 只能寫在最上層
  const { data: me, isLoading: meLoading } = useMyChannelId();
  const { data: categoryData, isLoading, isError, refetch } = useCategoryConfig(me?.channelId);
  const [activeTab, setActiveTab] = useState('雜談');
  const [pendingTab, setPendingTab] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    refetch: refetchVideos,
  } = useClassifiedVideos(me?.channelId);

  const existingNames = Object.keys(editableData?.[activeTab] || {});

  const isCurrentTabDirty = () => {
    return !isEqual(editableData?.[activeTab], categoryData?.[activeTab]);
  };

  // 2. early return，只負責顯示狀態，不影響 hooks 排序
  useEffect(() => {
    if (!meLoading && me?.channelId === null) {
      showLoginRequiredToast("請先登入以編輯分類設定");
      navigate("/");
    }
  }, [meLoading, me, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isCurrentTabDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editableData, categoryData, activeTab]);

  if (me?.channelId === null) return null;
  if (meLoading || !me?.channelId) {
    return (
      <MainLayout>
        <div className="p-6 max-w-xl mx-auto text-center text-gray-500">
          讀取中...
        </div>
      </MainLayout>
    );
  }
  if (isLoading) return <div>🔄 載入分類資料中...</div>;
  if (isError || !categoryData) return <div>❌ 無法載入分類資料。</div>;

  // 3. 正常 render
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

  const handleSave = async () => {
    try {
      const configRef = doc(
        db,
        'channel_data',
        me.channelId,
        'settings',
        'config'
      );
      await setDoc(configRef, editableData);
      toast.success('✅ 已儲存分類設定，重新整理中...');
      const result = await refetch();
      await refetchVideos();
      if (result.data) {
        setEditableData(structuredClone(result.data));
      } else {
        console.warn('⚠ 分類設定重新載入失敗，editableData 未同步');
      }
    } catch (err) {
      console.error('[儲存分類設定失敗]', err);
      showFailureToast('❌ 儲存失敗');
    }
  };

  const onTabChange = (newTab) => {
    if (newTab === activeTab) return;
    if (isCurrentTabDirty()) {
      setPendingTab(newTab);
      setIsDialogOpen(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleConfirmDiscard = () => {
    setEditableData({
      ...editableData,
      [activeTab]: categoryData[activeTab],
    });
    setActiveTab(pendingTab);
    setPendingTab(null);
    setIsDialogOpen(false);
  };

  const handleCancelDiscard = () => {
    setPendingTab(null);
    setIsDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-xl font-bold mb-4">自訂頻道分類</h1>
        <p className="text-sm text-gray-600 mb-4">
          自訂分類功能提供完全的客製關鍵字過濾功能，本站的分類邏輯僅依靠關鍵字比對標題。<br />
          本頁面所做的分類設定只會套用在你自己的頻道中，其他人無法共用你的設定。<br />
          遊戲的標題如果你用的是官方正式名稱，推薦從左側填表加入全系統分類，讓其他人共用遊戲名稱的設定。<br />
        </p>
        {isCurrentTabDirty() && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 text-sm px-4 py-2 rounded mb-4">
            ⚠ 尚未儲存變更，離開此頁或切換分頁前請記得儲存。
            <div className="flex justify-start">
              <button
                className="bg-green-600 text-white px-6 py-2 rounded shadow"
                onClick={handleSave}
              >
                💾 儲存設定
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3 mb-4">
          {FIXED_TABS.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded ${tab === activeTab ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
              onClick={() => onTabChange(tab)}
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

        {/* 💾 儲存設定 ＋ ➕ 新增子分類（同一行） */}
        <div className="flex justify-between items-center mb-8">
          {isCurrentTabDirty() && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 text-sm px-4 py-2 rounded mb-4">
              ⚠ 尚未儲存變更，離開此頁或切換分頁前請記得儲存。
              <div className="flex justify-start">
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded shadow"
                  onClick={handleSave}
                >
                  💾 儲存設定
                </button>
              </div>
            </div>
          )}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setIsAddModalOpen(true)}
          >
            ➕ 新增子分類
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

        {/* 🧾 放棄變更確認彈窗 */}
        <DiscardChangesDialog
          isOpen={isDialogOpen}
          currentTab={activeTab}
          targetTab={pendingTab}
          onCancel={handleCancelDiscard}
          onConfirm={handleConfirmDiscard}
        />
      </div>
    </MainLayout>
  );
};

export default ChannelCategoryEditorPage;
