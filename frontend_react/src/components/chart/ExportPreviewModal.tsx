import React, { useRef } from "react";
import { toPng } from "html-to-image";
import StyledExportCard from "./StyledExportCard";

const ExportPreviewModal = ({ videos, onClose }) => {
  const exportRef = useRef(null);

  const handleDownload = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#f9fafb",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "vmap-card.png";
      link.click();
    } catch (err) {
      console.error("圖卡匯出失敗", err);
    }
  };

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
