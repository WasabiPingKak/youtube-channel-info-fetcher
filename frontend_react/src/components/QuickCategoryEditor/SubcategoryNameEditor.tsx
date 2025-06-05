import React from 'react';

interface Props {
  keyword: string;
  subcategoryName: string;
  isEditing: boolean;
  editValue: string;
  setEditValue: (v: string) => void;
  setIsEditing: (v: boolean) => void;
  onConfirm: (newValue: string) => void;
  skipped?: boolean;
}

const SubcategoryNameEditor: React.FC<Props> = ({
  keyword,
  subcategoryName,
  isEditing,
  editValue,
  setEditValue,
  setIsEditing,
  onConfirm,
  skipped = false,
}) => {
  return (
    <div className="mb-2">
      {isEditing ? (
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1 w-48"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => onConfirm(editValue)}
          >
            確認
          </button>
          <button
            className="text-sm text-gray-500 hover:underline"
            onClick={() => setIsEditing(false)}
          >
            取消
          </button>
          <button
            className="text-sm text-orange-500 hover:underline"
            onClick={() => setEditValue(keyword)}
          >
            還原
          </button>
        </div>
      ) : (
        <div className={`mb-2 ${skipped ? 'text-gray-500' : ''}`}>
          {subcategoryName !== keyword && (
            <span className="text-sm text-gray-500 ml-2">
              （標題過濾詞來自「{keyword}」）
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SubcategoryNameEditor;
