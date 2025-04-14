import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import TabSwitcher from "./TabSwitcher";
import CategoryGroup from "./CategoryGroup";
import GameTagsGroup from "./GameTagsGroup";
import toast from "react-hot-toast";

const DEFAULT_CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";
const DEFAULT_STRUCTURE = {
  live: {},
  video: {},
  shorts: {},
};

export default function CategoryEditor() {
  const [data, setData] = useState(DEFAULT_STRUCTURE);
  const [tab, setTab] = useState("live");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "channel_settings", DEFAULT_CHANNEL_ID);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          setData(snapshot.data());
        } else {
          setData(DEFAULT_STRUCTURE);
        }
      } catch (err) {
        toast.error("無法載入資料，請稍後再試。");
        console.error("Fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const handleCategoryChange = (categoryName, keywords) => {
    const newData = { ...data };
    newData[tab][categoryName] = keywords;
    setData(newData);
  };

  const handleGameTagsChange = (gameTags) => {
    const newData = { ...data };
    newData[tab]["遊戲"] = gameTags;
    setData(newData);
  };

  const handleSave = async () => {
    try {
      const ref = doc(db, "channel_settings", DEFAULT_CHANNEL_ID);
      await setDoc(ref, data, { merge: false });
      toast.success("✅ 分類設定已儲存");
    } catch (err) {
      toast.error("❌ 儲存失敗，請稍後再試");
      console.error("Save error:", err);
    }
  };

  const categories = Object.entries(data[tab] || {})
    .filter(([name]) => name !== "遊戲")
    .sort((a, b) => {
      if (a[0] === "其他") return 1;
      if (b[0] === "其他") return -1;
      return a[0].localeCompare(b[0], "zh-Hant");
    });

  const gameTags = data[tab]?.["遊戲"] || [];

  return (
    <div className="space-y-4">
      <TabSwitcher value={tab} onChange={setTab} />
      {categories.map(([category, keywords]) => (
        <CategoryGroup
          key={category}
          category={category}
          keywords={keywords}
          onChange={(newKeywords) => handleCategoryChange(category, newKeywords)}
          disableDelete={category === "其他"}
        />
      ))}
      <GameTagsGroup gameTags={gameTags} onChange={handleGameTagsChange} />
      <div className="pt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          💾 儲存設定
        </button>
      </div>
    </div>
  );
}
