import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/layout/MainLayout";
import { filterAndSortAliases } from "../utils/filterAndSortAliases";
import AliasSearchBar from "../utils/AliasSearchBar";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwBtrIDR8n1VitpZ00j4Yd5XPLtrSrlfeY2Kc3j5Veoblc71_FefGopJ_zA6kDlZG5bpQ/exec?action=aliases";

const GameAliasPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["gameAliases"],
    queryFn: () => fetch(API_URL).then((res) => res.json()),
    staleTime: 1000 * 60 * 60, // 1 小時
  });

  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [openItems, setOpenItems] = useState(new Set());

  useEffect(() => {
    if (data) {
      const allKeys = Object.keys(data);
      setOpenItems(new Set(allKeys));
    }
  }, [data]);

  const filteredSortedData = useMemo(() => {
    return filterAndSortAliases({
      data,
      mode: "flat",
      searchText,
      sortOption,
    });
  }, [data, searchText, sortOption]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 text-center text-gray-600">載入中...</div>
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

  const totalAliases = filteredSortedData.reduce(
    (sum, item) => sum + item.aliases.length,
    0
  );

  const toggleItem = (name) => {
    const newSet = new Set(openItems);
    newSet.has(name) ? newSet.delete(name) : newSet.add(name);
    setOpenItems(newSet);
  };

  return (
    <MainLayout>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🎮 遊戲分類總表</h1>
        <p className="text-sm text-gray-600 mb-6">
          如果你沒有在這個表裡面找到你要的名字，請由左側填表新增。<br />
          由於快取機制的關係，最慢一小時會自動更新。
        </p>

        <AliasSearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          sortOption={sortOption}
          setSortOption={setSortOption}
          mode="game"
        />

        <div className="text-sm text-gray-600 mb-2">
          共 {filteredSortedData.length} 筆遊戲、{totalAliases} 個別名
        </div>

        <div className="space-y-2">
          {filteredSortedData.map(({ name, aliases }) => (
            <div key={name} className="border rounded shadow bg-white">
              <div
                className="font-bold px-4 py-2 bg-gray-100 cursor-pointer"
                onClick={() => toggleItem(name)}
              >
                {name} ({aliases.length})
              </div>
              {openItems.has(name) && (
                <ul className="px-6 py-2 list-disc text-sm text-gray-800">
                  {aliases.map((alias, i) => (
                    <li key={i}>{alias}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default GameAliasPage;
