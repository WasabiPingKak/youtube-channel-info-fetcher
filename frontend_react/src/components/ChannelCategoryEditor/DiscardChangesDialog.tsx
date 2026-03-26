import React from 'react';

const DiscardChangesDialog = ({
  isOpen,
  currentTab,
  targetTab,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-2">放棄變更確認</h2>
        <p className="text-sm text-gray-700 mb-4">
          你在「{currentTab}」頁面中有尚未儲存的變更。
          <br />
          確定要放棄這些變更並切換到「{targetTab}」嗎？
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            放棄變更並切換
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscardChangesDialog;
