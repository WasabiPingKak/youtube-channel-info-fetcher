import React, { useEffect } from "react";
import { useChannelSettings } from "@/hooks/useChannelSettings";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ClassificationEditorMock = () => {
  const { channelSettings, setChannelSettings, saveSettings, loading } = useChannelSettings();

  useEffect(() => {
    if (!channelSettings) return;
    console.log("載入成功：", channelSettings);
  }, [channelSettings]);

  if (!channelSettings) return <p>載入中...</p>;

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">頻道分類設定</h1>
      <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">
        {JSON.stringify(channelSettings, null, 2)}
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
