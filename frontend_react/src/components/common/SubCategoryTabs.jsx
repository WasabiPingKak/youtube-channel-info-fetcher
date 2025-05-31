import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";
const FIXED_CATEGORY_ORDER = ["遊戲", "雜談", "節目", "音樂"];

const SubCategoryTabs = ({
  activeType,
  activeCategory,
  onCategoryChange,
  videos = [],
}) => {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setError(false);
      try {
        const docRef = doc(
          db,
          `channel_data/${CHANNEL_ID}/settings/config`
        );
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setAvailableCategories([]);
          return;
        }

        const data = docSnap.data();
        const raw = Object.keys(data || {});
        const middle = FIXED_CATEGORY_ORDER.filter((cat) => raw.includes(cat));

        setAvailableCategories(middle);
      } catch (err) {
        console.error("❌ 無法載入分類設定", err);
        setError(true);
      }
    };

    fetchCategories();
  }, []);

  const orderedCategories = ["全部", ...availableCategories, "未分類"];

  if (error) return <div className="text-red-500">載入分類失敗</div>;

  return (
    <div className="flex flex-wrap gap-2 mb-4 px-4">
      {orderedCategories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-1 rounded-full border ${activeCategory === category
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
