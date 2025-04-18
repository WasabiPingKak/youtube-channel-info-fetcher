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
          const typeCategories = data[activeType];

          if (!typeCategories || typeof typeCategories !== "object") {
            setError(true);
            return;
          }

          const sortedCategories = Object.keys(typeCategories).sort((a, b) => {
            if (a === "其他") return 1;
            if (b === "其他") return -1;
            return 0;
          });

          setCategories(sortedCategories);
        } else {
          console.warn("No config document found");
          setError(true);
        }
      } catch (error) {
        console.error("[SubCategoryTabs] Failed to load config:", error);
        setError(true);
      }
    };

    fetchCategories();
  }, [activeType]);

  if (error) {
    return (
      <p className="px-4 py-2 text-red-600">
        🚫 無法載入分類。請檢查 Firestore 設定是否正確。
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="px-4 py-2 text-gray-600">
        ⚠ 此類型下尚未設定任何主分類，請至設定頁建立。
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {categories.map((category) => (
        <button
          key={category}
          className={`px-3 py-1 rounded-full border ${
            activeCategory === category
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
          }`}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default SubCategoryTabs;
