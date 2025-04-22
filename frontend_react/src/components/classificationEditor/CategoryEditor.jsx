import React, { useEffect, useState } from "react";
import { useChannelSettings } from "@/hooks/useChannelSettings";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CategoryGroup from "@/components/classificationEditor/CategoryGroup";
import GameTagsGroup from "@/components/classificationEditor/GameTagsGroup";
import UnsavedNoticeBar from "@/components/common/UnsavedNoticeBar";
import EditTabSwitcher from "@/components/classificationEditor/EditTabSwitcher";

const FIXED_CATEGORIES = ["雜談", "遊戲", "音樂", "節目", "其他"];

const CategoryEditor = () => {
  const { channelSettings, setChannelSettings, saveSettings, loading } = useChannelSettings();
  const [activeTab, setActiveTab] = useState("live");
  const [unsaved, setUnsaved] = useState(false);

  useEffect(() => {
    if (!channelSettings) return;
    console.log("✅ 載入成功：", channelSettings);
  }, [channelSettings]);

  if (!channelSettings) return <p>載入中...</p>;

  const currentTabData = channelSettings[activeTab] || {};
  const { 遊戲: gameTags = [], ...categories } = currentTabData;

  // fallback 主分類（若該 tab 下無分類）
  if (!channelSettings[activeTab] || Object.keys(channelSettings[activeTab]).length === 0) {
    const defaultData = {};
    FIXED_CATEGORIES.forEach((cat) => {
      defaultData[cat] = [];
    });
    setChannelSettings((prev) => ({
      ...prev,
      [activeTab]: defaultData,
    }));
    setUnsaved(true);
  }

  const handleSetData = (updater) => {
    setChannelSettings((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      return { ...updated };
    });
    setUnsaved(true);
  };

  const handleCategoryChange = (category, keywords) => {
    handleSetData((prev) => {
      const updated = { ...prev };
      updated[activeTab] = {
        ...updated[activeTab],
        [category]: keywords,
      };
      return updated;
    });
  };

  const handleCategoryRename = (oldName, newName) => {
    handleSetData((prev) => {
      const updated = { ...prev };
      const current = updated[activeTab];
      if (newName && newName !== oldName && !current[newName]) {
        current[newName] = current[oldName];
        delete current[oldName];
      }
      return updated;
    });
  };

  const handleGameChange = (newGames) => {
    handleSetData((prev) => {
      const updated = { ...prev };
      updated[activeTab] = {
        ...updated[activeTab],
        遊戲: newGames,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    await saveSettings();
    setUnsaved(false);
  };

  const sortedCategories = Object.entries(categories).sort((a, b) => {
    if (a[0] === "其他") return 1;
    if (b[0] === "其他") return -1;
    return a[0].localeCompare(b[0], "zh-Hant");
  });

  return (
    <div className="p-4 max-w-3xl relative">
      {unsaved && <UnsavedNoticeBar />}

      <h1 className="text-2xl font-bold mb-4">
        頻道分類設定 {unsaved && <span className="text-red-600 text-base">🔴 未儲存變更</span>}
      </h1>

      <EditTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="space-y-4">
        {sortedCategories.map(([category, keywords]) => (
          <CategoryGroup
            key={category}
            category={category}
            keywords={keywords}
            onChange={(newKeywords) => handleCategoryChange(category, newKeywords)}
            onRename={(newName) => handleCategoryRename(category, newName)}
            onDirty={() => setUnsaved(true)}
            disableDelete={FIXED_CATEGORIES.some((name) => category.startsWith(name))}
            disableEditName={category === "其他"}
          />
        ))}

        <GameTagsGroup gameTags={gameTags} onChange={handleGameChange} />

        <button
          onClick={handleSave}
          disabled={loading}
          className={`mt-4 px-4 py-2 text-white rounded
            ${unsaved ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            disabled:opacity-50`}
        >
          {loading ? "儲存中..." : unsaved ? "⚠ 尚未儲存 - 點我儲存" : "確認儲存"}
        </button>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default CategoryEditor;
