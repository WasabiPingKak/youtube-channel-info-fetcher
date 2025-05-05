import React, { useMemo, useState } from 'react';
import { Video, VideoType } from '../types/editor';
import { useEditorStore } from '../hooks/useEditorStore';
import { useCategoryFilterState } from '../hooks/useCategoryFilterState';
import ApplyModal from './ApplyModal';

export default function FilteredVideoList() {
  const store = useEditorStore();
  const activeType: VideoType = store.activeType;
  const videos: Video[] = store.videos;
  const activeKeywordFilter = store.activeKeywordFilter;
  const { selectedFilter } = useCategoryFilterState();

  const [isModalOpen, setModalOpen] = useState(false);

  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => v.type === activeType)
      .filter((v) =>
        activeKeywordFilter ? v.title.includes(activeKeywordFilter) : true
      )
      .filter((v) => {
        if (!selectedFilter) return true;
        const match = v.matchedCategories.includes(selectedFilter.name);
        const gameMatch =
          selectedFilter.type === 'game' && v.gameName === selectedFilter.name;
        return match || gameMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.publishDate ?? 0).getTime() -
          new Date(a.publishDate ?? 0).getTime()
      );
  }, [videos, activeType, activeKeywordFilter, selectedFilter]);

  return (
    <section className="border p-2 rounded-lg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">影片列表 ({filteredVideos.length})</h2>
      </header>

      {/* List */}
      <ul className="space-y-1 max-h-[60vh] overflow-auto pr-1 flex-1">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((v) => (
            <li
              key={v.videoId}
              className="flex items-center gap-2 px-4 py-2 border-b hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <span className="text-sm flex-1">{v.title}</span>
              <span className="flex gap-1 flex-wrap">
                {v.matchedCategories.map((c) => (
                  <span
                    key={c}
                    className="text-xs px-1 rounded bg-green-600 text-white"
                  >
                    {c === '遊戲' && v.gameName ? v.gameName : c}
                  </span>
                ))}
              </span>
            </li>
          ))
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
      {isModalOpen && (
        <ApplyModal
          videoIds={filteredVideos.map((v) => v.videoId)}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
