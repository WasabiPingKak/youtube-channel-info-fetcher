// components/FilteredVideoList.tsx
// --------------------------------------------------
// 顯示符合篩選的影片清單 + 新規格 Badge（含 [未分類] 占位）
// --------------------------------------------------

import React, { useMemo, useState } from 'react';
import type { Video, VideoType, Badge } from '../types/editor';
import { useEditorStore } from '../hooks/useEditorStore';
import { useCategoryFilterState } from '../hooks/useCategoryFilterState';
import ApplyModal from './ApplyModal';
import VideoBadge from './VideoBadge';

export default function FilteredVideoList() {
  /* -------- Store hooks -------- */
  const store = useEditorStore();
  const activeType: VideoType = store.activeType;
  const videos: Video[] = store.videos;
  const activeKeywordFilter = store.activeKeywordFilter;
  const { selectedFilter } = useCategoryFilterState();

  /* -------- Local state -------- */
  const [isModalOpen, setModalOpen] = useState(false);

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
      .sort(
        (a, b) =>
          new Date(b.publishDate ?? 0).getTime() -
          new Date(a.publishDate ?? 0).getTime(),
      );
  }, [videos, activeType, activeKeywordFilter, selectedFilter]);

  /* -------- Render -------- */
  return (
    <section className="border p-2 rounded-lg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">影片列表 ({filteredVideos.length})</h2>
      </header>

      {/* List */}
      <ul className="space-y-1 max-h-[60vh] overflow-auto pr-1 flex-1">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((v) => {
            // 確保每支影片至少顯示 [未分類] 一個 badge
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

      {/* Apply Button */}
      <button
        disabled={filteredVideos.length === 0}
        className="mt-2 bg-blue-600 text-white rounded px-4 py-2 text-sm disabled:bg-gray-300"
        onClick={() => setModalOpen(true)}
      >
        套用至分類 ▶
      </button>

      {/* Modal */}
      {isModalOpen && <ApplyModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}
