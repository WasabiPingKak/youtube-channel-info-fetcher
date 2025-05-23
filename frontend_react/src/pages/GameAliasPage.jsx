import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/layout/MainLayout";

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

    const filteredSortedData = useMemo(() => {
        if (!data) return [];
        const entries = Object.entries(data).map(([name, aliases]) => ({
            name,
            aliases,
        }));

        const lowerSearch = searchText.toLowerCase();
        const filtered = entries.filter(({ name, aliases }) => {
            return (
                name.toLowerCase().includes(lowerSearch) ||
                aliases.some((alias) => alias.toLowerCase().includes(lowerSearch))
            );
        });

        const sorted = filtered.sort((a, b) => {
            switch (sortOption) {
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                case "alias-more":
                    return b.aliases.length - a.aliases.length;
                case "alias-less":
                    return a.aliases.length - b.aliases.length;
                default:
                    return 0;
            }
        });
        return sorted;
    }, [data, searchText, sortOption]);

    useEffect(() => {
        if (data) {
            const allKeys = Object.keys(data);
            setOpenItems(new Set(allKeys));
        }
    }, [data]);

    const toggleItem = (name) => {
        const newSet = new Set(openItems);
        if (newSet.has(name)) newSet.delete(name);
        else newSet.add(name);
        setOpenItems(newSet);
    };

    if (isLoading) return <div>載入中...</div>;
    if (error) return <div>載入失敗：{error.message}</div>;

    const totalAliases = filteredSortedData.reduce(
        (sum, item) => sum + item.aliases.length,
        0
    );

    return (
        <MainLayout>
            <div className="p-4 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">🎮 遊戲別名總表</h1>
                <p className="text-sm text-gray-600 mb-6">
                    如果你沒有在這個表裡面找到你要的名字，請由左側填表新增。<br />
                    由於快取機制的關係，最慢一小時會自動更新。
                </p>
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="搜尋主名稱或別名..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                    />
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="border rounded px-2 py-2"
                    >
                        <option value="name-asc">主名稱 A→Z</option>
                        <option value="name-desc">主名稱 Z→A</option>
                        <option value="alias-more">別名數量 多→少</option>
                        <option value="alias-less">別名數量 少→多</option>
                    </select>
                </div>

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
