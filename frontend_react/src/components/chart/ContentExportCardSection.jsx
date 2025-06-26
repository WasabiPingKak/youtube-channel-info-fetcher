import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import ChannelInfoCard from "../common/ChannelInfoCard";
import ContentTreemapSection from "./ContentTreemapSection";
import StyledExportCard from "./StyledExportCard";
import ExportPreviewModal from "./ExportPreviewModal";
import VideoUploadHeatmap from "./VideoUploadHeatmap";

const ContentExportCardSection = ({ videos }) => {
  const exportRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("treemap");

  return (
    <div className="px-4 py-4 relative">

      {/* 頻道基本資訊 */}
      <ChannelInfoCard />

      {/* Tab 選單 */}
      <div className="flex gap-2 mt-2 mb-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab("treemap")}
          className={`px-3 py-1 rounded transition ${activeTab === "treemap"
              ? "bg-gray-200 text-black dark:bg-zinc-700 dark:text-white"
              : "text-gray-500 dark:text-gray-400"
            }`}
        >
          頻道熱力圖
        </button>
        <button
          onClick={() => setActiveTab("heatmap")}
          className={`px-3 py-1 rounded transition ${activeTab === "heatmap"
              ? "bg-gray-200 text-black dark:bg-zinc-700 dark:text-white"
              : "text-gray-500 dark:text-gray-400"
            }`}
        >
          活躍時段
        </button>
      </div>

      {/* 顯示內容區塊 */}
      {activeTab === "treemap" && <ContentTreemapSection videos={videos} />}
      {activeTab === "heatmap" && <VideoUploadHeatmap videos={videos} />}

      {/* 匯出卡片（固定 offscreen） */}
      <div
        ref={exportRef}
        className="fixed left-[-9999px] top-0 w-[1200px]"
        aria-hidden="true"
      >
        <StyledExportCard videos={videos} />
      </div>

      {/* 預覽 Modal 彈出視窗 */}
      {showModal && (
        <ExportPreviewModal
          videos={videos}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ContentExportCardSection;
