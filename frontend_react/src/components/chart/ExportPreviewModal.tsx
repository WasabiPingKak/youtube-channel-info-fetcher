import React from "react";
import type { ClassifiedVideoItem } from "@/types/category";

interface ExportPreviewModalProps {
  videos: ClassifiedVideoItem[];
  onClose: () => void;
}

const ExportPreviewModal = ({ videos: _videos, onClose }: ExportPreviewModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-4 shadow-lg w-[90vw] max-w-[1200px] max-h-[90vh] flex flex-col">
        {/* 頂部區塊：標題 + 關閉按鈕 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">圖卡預覽</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-xl">
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPreviewModal;
