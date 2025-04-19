import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const CHANNEL_ID = "UCLxa0YOtqi8IR5r2dSLXPng";

const SubCategoryTabs = ({ activeType, activeCategory, onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setError(false);
      try {
        const docRef = doc(db, `channel_data/${CHANNEL_ID}/settings/config`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const typeCategories = Object.keys(data[activeType] || {});
          const sortedCategories = [
            "全部",
            ...typeCategories.filter((c) => c !== "其他"),
            "其他",
          ];
          setCategories(sortedCategories);
        }
      } catch (err) {
        console.error("無法載入分類設定", err);
        setError(true);
      }
    };

    fetchCategories();
  }, [activeType]);

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
