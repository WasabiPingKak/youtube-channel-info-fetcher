// components/VideoBadge.tsx
// ---------------------------------------------
// 雙層 Badge 元件（同行版本）
// - 主分類 + keyword 同一行顯示
// - 超過寬度自動縮排，不破版
// - 遊戲類別支援 tooltip 顯示命中關鍵字
// ---------------------------------------------

import React from 'react';
import type { Badge } from "@/types/video";

const MAIN_COLOR_CLASS: Record<NonNullable<Badge['main']>, string> = {
  遊戲: 'bg-indigo-500 text-white',
  雜談: 'bg-emerald-500 text-white',
  節目: 'bg-yellow-400 text-yellow-900',
  音樂: 'bg-orange-400 text-white',
  其他: 'bg-slate-400 text-slate-800',
  未分類: 'bg-gray-300 text-gray-700',
};

const KEYWORD_COLOR_CLASS: Record<NonNullable<Badge['main']>, string> = {
  遊戲: 'bg-indigo-100 text-indigo-800',
  雜談: 'bg-emerald-100 text-emerald-800',
  節目: 'bg-yellow-100 text-yellow-800',
  音樂: 'bg-orange-100 text-orange-800',
  其他: 'bg-slate-100 text-slate-800',
  未分類: '',
};

interface VideoBadgeProps {
  badge: Badge & {
    hitKeywords?: string[];
  };
  className?: string;
}

export default function VideoBadge({ badge, className = '' }: VideoBadgeProps) {
  const outerClasses = `inline-flex max-w-full items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium ${MAIN_COLOR_CLASS[badge.main]} ${className}`;

  if (badge.main === '未分類') {
    return <span className={outerClasses}>無法分類</span>;
  }

  // ✅ 只有遊戲類別才顯示 tooltip，優先使用 hitKeywords
  const tooltipText =
    badge.main === '遊戲' && badge.hitKeywords?.length
      ? badge.hitKeywords.join(', ')
      : badge.tooltip;

  const wrapperProps =
    badge.main === '遊戲' && tooltipText
      ? { title: `命中關鍵字：${tooltipText}` }
      : {};

  return (
    <span className={outerClasses} {...wrapperProps}>
      {badge.main}
      {badge.keyword && (
        <span
          className={`truncate max-w-[160px] px-1.5 py-0 text-[10px] font-medium rounded-full ${KEYWORD_COLOR_CLASS[badge.main]}`}
        >
          {badge.keyword}
        </span>
      )}
    </span>
  );
}
