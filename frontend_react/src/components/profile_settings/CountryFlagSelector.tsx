import React, { useMemo, useState } from "react";
import { getCountryList } from "@/utils/getCountryList";

interface Props {
  selected: string[];
  onChange: (updatedList: string[]) => void;
}

export function CountryFlagSelector({ selected, onChange }: Props) {
  const allCountries = useMemo(() => getCountryList(), []);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return allCountries.filter(
      (c) =>
        !selected.includes(c.code) &&
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allCountries, selected]);

  const addCountry = (code: string) => {
    if (selected.length >= 10) return;
    if (!selected.includes(code)) {
      onChange([...selected, code]);
      setSearchTerm("");
    }
  };

  const removeCountry = (code: string) => {
    onChange(selected.filter((c) => c !== code));
  };

  return (
    <section className="mb-6">
      <label className="block font-medium mb-2 text-gray-800 dark:text-gray-100">
        🌍 選擇想要顯示的國旗
      </label>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="輸入國家英文名稱..."
        className="w-full border border-gray-300 dark:border-zinc-600 px-3 py-2 rounded-md mb-3 bg-white dark:bg-zinc-800 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
      />

      {/* 搜尋結果列表 */}
      {searchTerm && (
        <div className="mb-3 border border-gray-300 dark:border-zinc-600 rounded-md max-h-40 overflow-y-auto bg-white dark:bg-zinc-800">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <div
                key={c.code}
                onClick={() => addCountry(c.code)}
                className={`flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer ${selected.length >= 10 ? "opacity-50 pointer-events-none" : ""
                  }`}
              >
                <span className={`fi fi-${c.code.toLowerCase()} mr-2`} />
                <span className="text-gray-800 dark:text-gray-100">{c.name}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              找不到符合的國家
            </div>
          )}
        </div>
      )}

      {/* 已選徽章區 */}
      <div className="flex flex-wrap gap-2">
        {selected.map((code) => {
          const country = allCountries.find((c) => c.code === code);
          return (
            <div
              key={code}
              className="flex items-center gap-1 text-sm border border-gray-300 dark:border-zinc-600 px-2 py-1 rounded bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-100"
            >
              <span className={`fi fi-${code.toLowerCase()}`} />
              <span>{country?.name ?? code}</span>
              <button
                onClick={() => removeCountry(code)}
                className="ml-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* ✅ 超過上限提醒 */}
      {selected.length >= 10 && (
        <div className="text-sm text-red-500 dark:text-red-400 mt-2">
          最多只能選擇 10 個國家
        </div>
      )}
    </section>
  );
}
