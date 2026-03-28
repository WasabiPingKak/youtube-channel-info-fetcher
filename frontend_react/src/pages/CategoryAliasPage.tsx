import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import MainLayout from "../components/layout/MainLayout";
import { filterAndSortAliases, type SortOption } from "../utils/filterAndSortAliases";
import AliasSearchBar from "../utils/AliasSearchBar";

const SKIPPED_CATEGORY = "遊戲";

const CategoryAliasPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["defaultCategoryAliases"],
    queryFn: async () => {
      const docRef = doc(db, "global_settings", "default_categories_config_v2");
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? snapshot.data() : {};
    },
    staleTime: 1000 * 60 * 60, // 1 小時
  });

  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [openItems, setOpenItems] = useState(new Set());

  useEffect(() => {
    if (!data) return;
    const allKeys = new Set();
    Object.entries(data).forEach(([mainCategory, subMap]) => {
      if (mainCategory === SKIPPED_CATEGORY) return;
      Object.keys(subMap).forEach((subCategory) => {
        allKeys.add(`${mainCategory}::${subCategory}`);
      });
    });
    setOpenItems(allKeys); // eslint-disable-line react-hooks/set-state-in-effect -- 資料載入後初始化展開狀態
  }, [data]);

  const filteredSortedData = useMemo(() => {
    return filterAndSortAliases({
      data,
      mode: "nested",
      searchText,
      sortOption,
      skipTopLevelKey: SKIPPED_CATEGORY,
    }) as Record<string, [string, string[]][]>;
  }, [data, searchText, sortOption]);

  const totalSubcategories = Object.values(filteredSortedData).reduce(
    (sum, list) => sum + list.length,
    0
  );

  const totalAliases = Object.values(filteredSortedData).reduce(
    (sum, list) => sum + list.reduce((acc, [, aliases]) => acc + aliases.length, 0),
    0
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 text-center text-gray-600 dark:text-gray-300">載入中...</div>
      </MainLayout>
    );
  }
  if (error) {
    return (
      <MainLayout>
        <div className="p-4 text-center text-red-500">
          載入失敗：{error.message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          📂 主題分類總表（不含遊戲）
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          以下是所有非遊戲的預設分類列表。
          <br />
          系統會透過比對影片標題中的關鍵字，自動歸類到相應的分類中。
          <br />
          此表單中的過濾關鍵字為全系統共用，不開放編輯，僅提供檢視。
        </p>

        <AliasSearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          sortOption={sortOption}
          setSortOption={setSortOption}
          mode="category"
        />

        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          共 {Object.keys(filteredSortedData).length} 個主分類、{totalSubcategories} 個子分類、{totalAliases} 個別名
        </div>

        {Object.entries(filteredSortedData)
          .sort(([a], [b]) => {
            const order = ["雜談", "節目", "音樂"];
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          })
          .map(([mainCategory, subList]) => (
            <div key={mainCategory} className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                📁 {mainCategory}
              </h2>
              <div className="space-y-2">
                {subList.length > 0 ? (
                  subList.map(([subCategory, aliases]) => {
                    const key = `${mainCategory}::${subCategory}`;
                    return (
                      <div
                        key={key}
                        className="border border-gray-300 dark:border-zinc-600 rounded shadow bg-white dark:bg-zinc-800"
                      >
                        <div
                          className="font-bold px-4 py-2 bg-gray-100 dark:bg-zinc-700 cursor-pointer text-gray-800 dark:text-gray-100"
                          onClick={() => {
                            const newSet = new Set(openItems);
                            if (newSet.has(key)) {
                              newSet.delete(key);
                            } else {
                              newSet.add(key);
                            }
                            setOpenItems(newSet);
                          }}
                        >
                          {subCategory} ({aliases.length})
                        </div>
                        {openItems.has(key) && (
                          <ul className="px-6 py-2 list-disc text-sm text-gray-800 dark:text-gray-100">
                            {aliases.map((alias, i) => (
                              <li key={i}>{alias}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-500 pl-2">
                    （無符合的子分類）
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </MainLayout>
  );
};

export default CategoryAliasPage;
