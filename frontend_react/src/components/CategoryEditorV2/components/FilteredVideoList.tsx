// components/FilteredVideoList.tsx
// --------------------------------------------------
// 顯示符合篩選的影片清單 + 主分類篩選 + 套用限制提示
// --------------------------------------------------

import React, { useMemo, useState } from 'react';
import type { Video, VideoType, Badge } from '../types/editor';
import { useEditorStore } from '../hooks/useEditorStore';
import { useCategoryFilterState } from '../hooks/useCategoryFilterState';
import ApplyModal from './ApplyModal';
import VideoBadge from './VideoBadge';

const MAIN_CATEGORIES = ['雜談', '節目', '遊戲', '音樂', '未分類'] as const;
type MainCategory = typeof MAIN_CATEGORIES[number];

export default function FilteredVideoList() {
  /* -------- Store hooks -------- */
  const store = useEditorStore();
  const activeType: VideoType = store.activeType;
  const videos: Video[] = store.videos;
  const activeKeywordFilter = store.activeKeywordFilter;
  const { selectedFilter } = useCategoryFilterState();

  /* -------- Local state -------- */
  const [isModalOpen, setModalOpen] = useState(false);
  const [mainCategoryFilter, setMainCategoryFilter] = useState<MainCategory | null>(null);

  /* -------- Derived: 篩選後影片清單 -------- */
  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => v.type === activeType)
      .filter((v) =>
        activeKeywordFilter ? v.title.includes(activeKeywordFilter) : true
      )
      .filter((v) => {
        if (!selectedFilter) return true;
        return v.title.includes(selectedFilter.name);
      })
      .filter((v) => {
        if (!mainCategoryFilter) return true;
        const badgeList = v.badges && v.badges.length > 0 ? v.badges : [{ main: '未分類' }];
        return badgeList.some((b) =>
          mainCategoryFilter === '未分類'
            ? b.main === '未分類'
            : b.main === mainCategoryFilter
        );
      })
      .sort(
        (a, b) =>
          new Date(b.publishDate ?? 0).getTime() -
          new Date(a.publishDate ?? 0).getTime(),
      );
  }, [videos, activeType, activeKeywordFilter, selectedFilter, mainCategoryFilter]);

  /* -------- 是否允許套用 -------- */
  const canApply = filteredVideos.length > 0 && !!activeKeywordFilter;

  /* -------- Render -------- */
  return (
    <section className="border p-2 rounded-lg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">影片列表 ({filteredVideos.length})</h2>
      </header>

      {/* 主分類切換按鈕 */}
      <div className="flex space-x-2 mb-2">
        <button
          onClick={() => setMainCategoryFilter(null)}
          className={`px-3 py-1 text-sm rounded-full ${
            mainCategoryFilter === null ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          全部
        </button>
        {MAIN_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setMainCategoryFilter(cat)}
            className={`px-3 py-1 text-sm rounded-full ${
              mainCategoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <ul className="space-y-1 max-h-[60vh] overflow-auto pr-1 flex-1">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((v) => {
            const badgeList: Badge[] =
              v.badges && v.badges.length > 0
                ? v.badges
                : [{ main: '未分類' }];

            return (
              <li
                key={v.videoId}
                className="flex items-center gap-2 px-4 py-2 border-b hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {/* Title */}
                <span className="text-sm flex-1 truncate" title={v.title}>
                  {v.title}
                </span>

                {/* Badges */}
                <span className="flex gap-1 flex-wrap">
                  {badgeList.map((b, idx) => (
                    <VideoBadge
                      key={`${b.main}-${b.keyword ?? 'none'}-${idx}`}
                      badge={b}
                    />
                  ))}
                </span>
              </li>
            );
          })
        ) : (
          <li className="text-gray-400 text-sm py-4 text-center">
            目前沒有符合篩選的影片
          </li>
        )}
      </ul>

      {/* Apply Button + 說明文字 */}
      <div className="mt-2">
        <button
          disabled={!canApply}
          className="bg-blue-600 text-white rounded px-4 py-2 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setModalOpen(true)}
        >
          套用至分類 ▶
        </button>
        {!canApply && (
          <p className="text-sm text-red-500 mt-1">
            請先從上方標籤選擇關鍵字，才能套用至分類，若沒有可用的關鍵字，請直接從✍️ 自訂關鍵字新增
          </p>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && <ApplyModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}
