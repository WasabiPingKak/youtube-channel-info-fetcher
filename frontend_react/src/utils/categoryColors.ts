/**
 * 分類配色系統 — badge、chip、圖表共用
 *
 * 每個分類定義：
 * - bg: 填色背景（badge active / chip active / 圖表扇區）
 * - text: 文字色
 * - bgMuted: 淡色背景（chip inactive light mode）
 * - bgMutedDark: 淡色背景（chip inactive dark mode）
 * - hex: 圖表用的十六進位色碼
 */

export interface CategoryColorScheme {
    bg: string;
    text: string;
    bgMuted: string;
    textMuted: string;
    bgMutedDark: string;
    textMutedDark: string;
    hex: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColorScheme> = {
    遊戲: {
        bg: "bg-indigo-500",
        text: "text-white",
        bgMuted: "bg-indigo-50",
        textMuted: "text-indigo-700",
        bgMutedDark: "dark:bg-indigo-950",
        textMutedDark: "dark:text-indigo-300",
        hex: "#6366f1",
    },
    雜談: {
        bg: "bg-emerald-500",
        text: "text-white",
        bgMuted: "bg-emerald-50",
        textMuted: "text-emerald-700",
        bgMutedDark: "dark:bg-emerald-950",
        textMutedDark: "dark:text-emerald-300",
        hex: "#10b981",
    },
    節目: {
        bg: "bg-amber-400",
        text: "text-amber-900",
        bgMuted: "bg-amber-50",
        textMuted: "text-amber-700",
        bgMutedDark: "dark:bg-amber-950",
        textMutedDark: "dark:text-amber-300",
        hex: "#f59e0b",
    },
    音樂: {
        bg: "bg-orange-400",
        text: "text-white",
        bgMuted: "bg-orange-50",
        textMuted: "text-orange-700",
        bgMutedDark: "dark:bg-orange-950",
        textMutedDark: "dark:text-orange-300",
        hex: "#f97316",
    },
    未分類: {
        bg: "bg-gray-300 dark:bg-zinc-600",
        text: "text-gray-700 dark:text-gray-200",
        bgMuted: "bg-gray-100",
        textMuted: "text-gray-600",
        bgMutedDark: "dark:bg-zinc-800",
        textMutedDark: "dark:text-gray-400",
        hex: "#9ca3af",
    },
};

const FALLBACK: CategoryColorScheme = {
    bg: "bg-slate-400",
    text: "text-white",
    bgMuted: "bg-slate-50",
    textMuted: "text-slate-600",
    bgMutedDark: "dark:bg-slate-900",
    textMutedDark: "dark:text-slate-400",
    hex: "#94a3b8",
};

export const getCategoryColorScheme = (category: string): CategoryColorScheme =>
    CATEGORY_COLORS[category] || FALLBACK;

/** 依 category 名稱順序取得 hex 色碼（圖表用） */
export const getCategoryHex = (category: string): string =>
    (CATEGORY_COLORS[category] || FALLBACK).hex;
