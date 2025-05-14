// src/hooks/useVideoSortControl.ts
import { useState, useCallback } from "react";

/**
 * 排序欄位的類型（可擴充）
 */
export type SortField = "title" | "publishDate" | "duration" | "game" | "matchedKeywords";
export type SortOrder = "asc" | "desc";

interface UseVideoSortControlResult {
  sortField: SortField;
  sortOrder: SortOrder;
  handleSortChange: (field: SortField) => void;
}

/**
 * 控制影片排序欄位與排序方向的 hook
 * @param defaultField 預設排序欄位（例如 "publishDate"）
 */
export default function useVideoSortControl(
  defaultField: SortField = "publishDate"
): UseVideoSortControlResult {
  const [sortField, setSortField] = useState<SortField>(defaultField);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSortChange = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        // 點同欄位 → 切換升降冪
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        // 換欄位 → 改欄位並重設為降冪
        setSortField(field);
        setSortOrder("desc");
      }
    },
    [sortField]
  );

  return {
    sortField,
    sortOrder,
    handleSortChange,
  };
}
