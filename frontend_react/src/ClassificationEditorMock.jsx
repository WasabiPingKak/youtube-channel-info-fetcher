import React, { useEffect, useState } from "react";
import { useChannelSettings } from "@/hooks/useChannelSettings";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TabSwitcher } from "@/components/TabSwitcher";
import { CategoryGroup } from "@/components/CategoryGroup";
import { GameTagsGroup } from "@/components/GameTagsGroup";
import { UnsavedNoticeBar } from "@/components/UnsavedNoticeBar";

const ClassificationEditorMock = () => {
  const { channelSettings, setChannelSettings, saveSettings, loading } = useChannelSettings();
  const [activeTab, setActiveTab] = useState("live");
  const [unsaved, setUnsaved] = useState(false);

  useEffect(() => {
    if (!channelSettings) return;
    console.log("載入成功：", channelSettings);
  }, [channelSettings]);

  if (!channelSettings) return <p>載入中...</p>;

  const currentData = channelSettings.classifications[activeTab];

  const handleSetData = (updater) => {
    setChannelSettings(updater);
    setUnsaved(true);
  };

  const handleSave = async () => {
    await saveSettings();
    setUnsaved(false);
  };

  return (
    <div className="p-4 max-w-3xl relative">
      {unsaved && <UnsavedNoticeBar />}

      <h1 className="text-2xl font-bold mb-4">
        頻道分類設定 {unsaved && <span className="text-red-600 text-base">🔴 未儲存變更</span>}
      </h1>

      <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

      <CategoryGroup
        type={activeTab}
        data={currentData}
        setData={handleSetData}
      />

      <GameTagsGroup
        data={channelSettings.game_tags}
        setData={handleSetData}
      />

      <button
        onClick={handleSave}
        disabled={loading}
        className={`mt-4 px-4 py-2 text-white rounded
          ${unsaved ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
          disabled:opacity-50`}
      >
        {loading ? "儲存中..." : unsaved ? "⚠ 尚未儲存 - 點我儲存" : "確認儲存"}
      </button>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default ClassificationEditorMock;
