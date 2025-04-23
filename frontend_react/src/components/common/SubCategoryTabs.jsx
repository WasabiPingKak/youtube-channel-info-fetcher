import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";
const VIDEO_TYPE_MAP = { live: "直播檔", videos: "影片", shorts: "Shorts" };

const SubCategoryTabs = ({
  activeType,
  activeCategory,
  onCategoryChange,
  videos = [],
}) => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 依目前影片類型統計各分類數量 → 排序
    const fetchAndSortCategories = async () => {
      setError(false);
      try {
        /* 1. 讀設定檔，取得「該影片類型」所有主分類（不含「其他」） */
        const docRef = doc(
          db,
          `channel_data/${CHANNEL_ID}/settings/config`
        );
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setCategories(["全部", "其他"]);
          return;
        }

        const data = docSnap.data();
        const baseCategories = Object.keys(data?.[activeType] || {}).filter(
          (c) => c !== "其他"
        );

        /* 2. 統計影片數量 */
        const expectedType = VIDEO_TYPE_MAP[activeType];
        const counts = {};
        videos.forEach((video) => {
          if (video.type !== expectedType) return;
          if (Array.isArray(video.matchedCategories)) {
            video.matchedCategories.forEach((cat) => {
              counts[cat] = (counts[cat] || 0) + 1;
            });
          }
        });

        /* 3. 依 count 由多到少排序（即使 0 也納入） */
        const middle = baseCategories.sort(
          (a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)
        );

        /* 4. 完整順序：全部 → middle → 其他 */
        setCategories(["全部", ...middle, "其他"]);
      } catch (err) {
        console.error("無法載入分類設定", err);
        setError(true);
      }
    };

    fetchAndSortCategories();
  }, [activeType, videos]);

  if (error) return <div className="text-red-500">載入分類失敗</div>;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-1 rounded-full border ${
            activeCategory === category
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default SubCategoryTabs;
