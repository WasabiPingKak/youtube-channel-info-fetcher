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
      setSearchTerm(""); // 清空搜尋
    }
  };

  const removeCountry = (code: string) => {
    onChange(selected.filter((c) => c !== code));
  };

  return (
    <section className="mb-6">
      <label className="block font-medium mb-2">🌍 選擇想要顯示的國旗 </label>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="輸入國家英文名稱..."
        className="w-full border px-3 py-2 rounded-md mb-3"
      />

      {/* 搜尋結果列表 */}
      {searchTerm && (
        <div className="mb-3 border rounded-md max-h-40 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <div
                key={c.code}
                onClick={() => addCountry(c.code)}
                className={`flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                  selected.length >= 10 ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <span className={`fi fi-${c.code.toLowerCase()} mr-2`} />
                <span>{c.name}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
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
              className="flex items-center gap-1 text-sm border px-2 py-1 rounded bg-gray-50"
            >
              <span className={`fi fi-${code.toLowerCase()}`} />
              <span>{country?.name ?? code}</span>
              <button
                onClick={() => removeCountry(code)}
                className="ml-1 text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* ✅ 超過上限提醒 */}
      {selected.length >= 10 && (
        <div className="text-sm text-red-500 mt-2">
          最多只能選擇 10 個國家
        </div>
      )}
    </section>
  );
}
