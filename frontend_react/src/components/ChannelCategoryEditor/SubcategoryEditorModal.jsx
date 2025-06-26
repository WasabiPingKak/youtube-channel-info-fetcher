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
  const inputRef = useRef();

  useEffect(() => {
    if (isOpen) {
      setName(originalName || '');
      setError('');
    }
  }, [isOpen, originalName]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
      <div className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-lg p-6 w-full max-w-md shadow-lg h-[500px] max-h-[90vh] flex flex-col">
        <h2 className="text-lg font-bold mb-4">
          {title || '子分類設定'}
        </h2>

        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
          子分類名稱：
        </label>
        <input
          ref={inputRef}
          className="border border-gray-300 dark:border-zinc-600 px-3 py-2 rounded w-full mb-2 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />

        {error && <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>}

        {/* 預覽區塊使用 flex-grow 滿足空間，讓捲動不推擠其他區塊 */}
        <div className="flex-grow overflow-y-auto border border-gray-200 dark:border-zinc-700 rounded mt-2 bg-gray-50 dark:bg-zinc-900">
          <MatchedVideosPreview query={name} videos={videos} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-600"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
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
