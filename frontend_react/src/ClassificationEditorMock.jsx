import React, { useEffect, useState } from "react";
import { useChannelSettings } from "@/hooks/useChannelSettings";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TabSwitcher } from "@/components/TabSwitcher";

const ClassificationEditorMock = () => {
  const { channelSettings, setChannelSettings, saveSettings, loading } = useChannelSettings();
  const [activeTab, setActiveTab] = useState("live");

  useEffect(() => {
    if (!channelSettings) return;
    console.log("載入成功：", channelSettings);
  }, [channelSettings]);

  if (!channelSettings) return <p>載入中...</p>;

  const currentClassifications = channelSettings.classifications[activeTab];

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">頻道分類設定</h1>

      <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

      <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
        {JSON.stringify(currentClassifications, null, 2)}
      </pre>

      <button
        onClick={saveSettings}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "儲存中..." : "確認儲存"}
      </button>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default ClassificationEditorMock;
