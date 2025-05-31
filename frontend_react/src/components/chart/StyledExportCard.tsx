import React from "react";
import ChannelInfoCard from "../common/ChannelInfoCard";
import ContentTreemapSection from "./ContentTreemapSection";

const StyledExportCard = ({ videos }) => {
  return (
    <div className="bg-[#f9fafb] rounded-xl shadow-xl w-[1200px] mx-auto overflow-hidden">
      <div className="flex flex-col">
        {/* 上方：頻道資訊 */}
        <div className="border-b border-gray-200 p-6">
          <ChannelInfoCard />
        </div>

        {/* 下方：分類熱力圖 */}
        <div className="p-4 md:p-6">
          <ContentTreemapSection videos={videos} />
        </div>
      </div>
    </div>
  );
};

export default StyledExportCard;
