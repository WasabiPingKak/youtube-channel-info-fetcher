import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/layout/MainLayout";
import { filterAndSortAliases, type SortOption } from "../utils/filterAndSortAliases";
import AliasSearchBar from "../utils/AliasSearchBar";
import GameAliasContributorsSection from "../components/contributors/GameAliasContributorsSection";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwBtrIDR8n1VitpZ00j4Yd5XPLtrSrlfeY2Kc3j5Veoblc71_FefGopJ_zA6kDlZG5bpQ/exec?action=aliases";

const GameAliasPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["gameAliases"],
    queryFn: () => fetch(API_URL).then((res) => res.json()),
    staleTime: 1000 * 60 * 60, // 1 小時
  });

  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [openItems, setOpenItems] = useState(new Set());

  useEffect(() => {
    if (data) {
      const allKeys = Object.keys(data);
      setOpenItems(new Set(allKeys)); // eslint-disable-line react-hooks/set-state-in-effect -- 資料載入後初始化展開狀態
    }
  }, [data]);

  const filteredSortedData = useMemo(() => {
    return filterAndSortAliases({
      data,
      mode: "flat",
      searchText,
      sortOption,
    }) as { name: string; aliases: string[] }[];
  }, [data, searchText, sortOption]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 text-center text-gray-600 dark:text-gray-400">載入中...</div>
      </MainLayout>
    );
  }
  if (error) {
    return (
      <MainLayout>
        <div className="p-4 text-center text-red-500 dark:text-red-400">
          載入失敗：{error.message}
        </div>
      </MainLayout>
    );
  }

  const totalAliases = filteredSortedData.reduce(
    (sum, item) => sum + item.aliases.length,
    0
  );

  const toggleItem = (name: string) => {
    const newSet = new Set(openItems);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setOpenItems(newSet);
  };

  return (
    <MainLayout>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">🎮 遊戲分類總表</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          如果你沒有在這個表裡面找到你要的遊戲名稱，請點擊下方按鈕填表新增。<br />
          由於快取機制的關係，最慢一小時會自動更新。
        </p>

        <a
          href="https://forms.gle/QU3tMBTu7MgucSgZ7"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-zinc-700 text-sm font-medium mb-6"
        >
          📝 協助擴增遊戲名單
        </a>

        {/* 貢獻遊戲名稱清單（可收合） */}
        <GameAliasContributorsSection className="mb-6" />

        <AliasSearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          sortOption={sortOption}
          setSortOption={(v: string) => setSortOption(v as SortOption)}
          mode="game"
        />

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          共 {filteredSortedData.length} 筆遊戲、{totalAliases} 個別名
        </div>

        <div className="space-y-2">
          {filteredSortedData.map(({ name, aliases }) => (
            <div key={name} className="border rounded shadow bg-white dark:bg-zinc-800 dark:border-zinc-600">
              <div
                className="font-bold px-4 py-2 bg-gray-100 dark:bg-zinc-700 cursor-pointer"
                onClick={() => toggleItem(name)}
              >
                {name} ({aliases.length})
              </div>
              {openItems.has(name) && (
                <ul className="px-6 py-2 list-disc text-sm text-gray-800 dark:text-gray-200">
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
