import React, { useMemo, useState } from 'react';
import {
  MainCategory,
  Video,
  VideoType,
} from '../types/editor';
import { useEditorStore } from '../hooks/useEditorStore';
import ApplyModal from './ApplyModal';

/** 右欄主分類篩選（含「全部」，不包含「其他」） */
type FilterCategory = '全部' | MainCategory;
const mainCategories: FilterCategory[] = [
  '全部',
  '雜談',
  '節目',
  '音樂',
  '遊戲',
];

export default function VideoDualList() {
  const store = useEditorStore();
  const activeType = store.activeType;
  const videos = store.videos;
  const activeKeywordFilter = store.activeKeywordFilter; // ✅ 使 useMemo 能夠觸發重算

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rightFilter, setRightFilter] = useState<FilterCategory>('全部');
  const [isModalOpen, setModalOpen] = useState(false);

  const unclassified = useMemo(() =>
    store
      .getUnclassifiedVideos()
      .filter((v) => v.type === activeType)
      .sort((a, b) => new Date(b.publishDate ?? 0).getTime() - new Date(a.publishDate ?? 0).getTime()),
    [activeType, videos, activeKeywordFilter] // ✅ 加入 keyword 篩選依賴
  );

  const classified = useMemo(() =>
    store
      .getClassifiedVideos()
      .filter((v) => v.type === activeType)
      .sort((a, b) => new Date(b.publishDate ?? 0).getTime() - new Date(a.publishDate ?? 0).getTime()),
    [activeType, videos, activeKeywordFilter] // ✅ 加入 keyword 篩選依賴
  );

  const filteredClassified = useMemo(() => {
    if (rightFilter === '全部') return classified;
    return classified.filter((v) =>
      v.matchedCategories?.includes(rightFilter as MainCategory)
    );
  }, [classified, rightFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (list: Video[]) => {
    const allSelected = list.every((v) => selectedIds.has(v.videoId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      list.forEach((v) => {
        allSelected ? next.delete(v.videoId) : next.add(v.videoId);
      });
      return next;
    });
  };

  const isAllSelected = (list: Video[]) => {
    return list.length > 0 && list.every((v) => selectedIds.has(v.videoId));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const restoreSelected = () => {
    const nextVideos = videos.map((v) =>
      selectedIds.has(v.videoId)
        ? { ...v, matchedCategories: [], gameName: undefined }
        : v
    );
    store.updateVideos(nextVideos);
    store.markUnsaved();
    clearSelection();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* ===== 未分類左欄 ===== */}
      <section className="border p-2 rounded-lg flex flex-col">
        <header className="flex flex-col gap-1 mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAllSelected(unclassified)}
              onChange={() => toggleSelectAll(unclassified)}
            />
            <h2 className="font-semibold">
              未分類 ({unclassified.length})
              <span
                className="ml-1 text-xs text-gray-400"
                title="未分類影片將自動被歸入「其他」"
              >
                ⓘ
              </span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            ※ 未套用分類的影片將自動歸入「其他」
          </p>
        </header>

        <ul className="space-y-1 max-h-[60vh] overflow-auto pr-1 flex-1">
          {unclassified.map((v) => (
            <li
              key={v.videoId}
              className="flex items-center gap-2 px-4 py-2 border-b hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(v.videoId)}
                onChange={() => toggleSelect(v.videoId)}
              />
              <span className="text-sm">{v.title}</span>
            </li>
          ))}
          {unclassified.length === 0 && (
            <li className="text-gray-400 text-sm py-4 text-center">
              目前無未分類影片
              <br />
              <span className="text-xs text-gray-500">
                未分類影片將自動被標記為「其他」
              </span>
            </li>
          )}
        </ul>

        <button
          disabled={selectedIds.size === 0}
          className="mt-2 bg-blue-600 text-white rounded px-4 py-2 text-sm disabled:bg-gray-300"
          onClick={() => setModalOpen(true)}
        >
          套用至分類 ▶
        </button>
      </section>

      {/* ===== 已分類右欄 ===== */}
      <section className="border p-2 rounded-lg flex flex-col">
        <header className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAllSelected(filteredClassified)}
              onChange={() => toggleSelectAll(filteredClassified)}
            />
            <h2 className="font-semibold">已分類 ({classified.length})</h2>
          </div>

          <div className="flex flex-wrap gap-1">
            {mainCategories.map((cat) => (
              <button
                key={cat}
                className={`px-3 py-0.5 text-sm rounded-full ${
                  rightFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                onClick={() => setRightFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        <ul className="space-y-1 max-h-[60vh] overflow-auto pr-1 flex-1">
          {filteredClassified.map((v) => (
            <li
              key={v.videoId}
              className="flex items-center gap-2 px-4 py-2 border-b hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(v.videoId)}
                onChange={() => toggleSelect(v.videoId)}
              />
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
          ))}
          {filteredClassified.length === 0 && (
            <li className="text-gray-400 text-sm py-4 text-center">
              無符合篩選的影片
            </li>
          )}
        </ul>

        <button
          disabled={selectedIds.size === 0}
          className="mt-2 bg-gray-200 text-black rounded px-4 py-2 text-sm disabled:opacity-50"
          onClick={restoreSelected}
        >
          ◀ 還原至未分類
        </button>
      </section>

      {isModalOpen && (
        <ApplyModal
          videoIds={[...selectedIds]}
          onClose={() => {
            clearSelection();
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
