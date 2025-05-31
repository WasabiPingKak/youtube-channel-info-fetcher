import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import ChannelInfoCard from "../common/ChannelInfoCard";
import ContentTreemapSection from "./ContentTreemapSection";
import StyledExportCard from "./StyledExportCard";
import ExportPreviewModal from "./ExportPreviewModal";

const ContentExportCardSection = ({ videos }) => {
  const exportRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="px-4 py-4 relative">

      {/* 畫面展示用卡片（不含設計樣式） */}
      <ChannelInfoCard />
      <ContentTreemapSection videos={videos} />

      {/* 匯出時使用的離螢幕卡片樣式 */}
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
