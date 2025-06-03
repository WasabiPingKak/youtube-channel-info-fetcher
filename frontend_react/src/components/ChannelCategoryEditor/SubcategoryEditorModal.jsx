import React, { useState, useEffect, useRef } from 'react';
import MatchedVideosPreview from './MatchedVideosPreview';

const SubcategoryEditorModal = ({
  title,
  isOpen,
  onClose,
  originalName,
  onRename,
  existingNames = [],
  videos = [],
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const backdropRef = useRef();

  useEffect(() => {
    if (isOpen) {
      setName(originalName || '');
      setError('');
    }
  }, [isOpen, originalName]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('請輸入子分類名稱');
      return;
    }
    if (trimmed !== originalName && existingNames.includes(trimmed)) {
      setError('子分類名稱已存在');
      return;
    }

    onRename(originalName, trimmed);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg h-[500px] max-h-[90vh] flex flex-col">
        <h2 className="text-lg font-bold mb-4">{title || '子分類設定'}</h2>

        <label className="block text-sm mb-1">子分類名稱：</label>
        <input
          className="border px-3 py-2 rounded w-full mb-2"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        {/* 預覽區塊使用 flex-grow 滿足空間，讓捲動不推擠其他區塊 */}
        <div className="flex-grow overflow-y-auto border rounded mt-2">
          <MatchedVideosPreview query={name} videos={videos} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>
            取消
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleSave}
          >
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubcategoryEditorModal;
