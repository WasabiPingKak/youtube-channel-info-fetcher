// components/VideoBadge.tsx
// ---------------------------------------------
// 雙層 Badge 元件
// ‑ 外層依 "主類別" 上色（固定色）
// ‑ 內層依主類別對應預設色（不再用動態 HSL）
// ‑ 當 main === '未分類' 只渲染單層灰色 badge
// ---------------------------------------------

import React from 'react';
import type { Badge } from '../types/editor';

// 主類別對應的外層配色（固定）
const MAIN_COLOR_CLASS: Record<
  NonNullable<Badge['main']>,
  string
> = {
  雜談: 'bg-pink-400 text-pink-900',
  節目: 'bg-violet-400 text-violet-900',
  音樂: 'bg-emerald-400 text-emerald-900',
  遊戲: 'bg-yellow-400 text-yellow-900',
  其他: 'bg-slate-400 text-slate-800',
  未分類: 'bg-gray-300 text-gray-700',
};

// 主類別對應的 keyword 配色（輕色背景 + 深文字）
const KEYWORD_COLOR_CLASS: Record<
  NonNullable<Badge['main']>,
  string
> = {
  雜談: 'bg-pink-100 text-pink-900',
  節目: 'bg-violet-100 text-violet-900',
  音樂: 'bg-emerald-100 text-emerald-900',
  遊戲: 'bg-yellow-100 text-yellow-900',
  其他: 'bg-slate-100 text-slate-800',
  未分類: '', // 不會渲染 keyword
};

interface VideoBadgeProps {
  badge: Badge;
  /** 額外 className（可控制 margin 等） */
  className?: string;
}

export default function VideoBadge({ badge, className = '' }: VideoBadgeProps) {
  const outerClasses = `inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${MAIN_COLOR_CLASS[badge.main]} ${className}`;

  if (badge.main === '未分類') {
    return <span className={outerClasses}>未分類</span>;
  }

  // 嵌套顯示 keyword： [主類別[關鍵字]]
  return (
    <span className={outerClasses}>
      {badge.main}
      {badge.keyword && (
        <span
          className={`ml-1 inline-block rounded-full px-1.5 py-0 text-[10px] font-medium align-middle ${KEYWORD_COLOR_CLASS[badge.main]}`}
        >
          {badge.keyword}
        </span>
      )}
    </span>
  );
}
