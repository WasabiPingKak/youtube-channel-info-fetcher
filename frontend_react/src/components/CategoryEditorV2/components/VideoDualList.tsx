/**
 * VideoDualList
 * -------------
 * 左：未分類　右：已分類（可依主分類篩選）
 */

import React, { useMemo, useState } from 'react';
import {
  MainCategory,
  Video,
  VideoType,
} from '../types/editor';
import { useEditorStore } from '../hooks/useEditorStore';
import ApplyModal from './ApplyModal';

/** 右欄主分類篩選（含「全部」） */
type FilterCategory = '全部' | MainCategory;
const mainCategories: FilterCategory[] = [
  '全部',
  '雜談',
  '節目',
  '音樂',
  '遊戲',
  '其他',
];

export default function VideoDualList() {
  /** ===== Store ===== */
  const activeType = useEditorStore((s) => s.activeType);
  const videos = useEditorStore((s) => s.videos);

  /** ===== Local State ===== */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rightFilter, setRightFilter] = useState<FilterCategory>('全部');
  const [isModalOpen, setModalOpen] = useState(false);

  /** ===== Derived Lists ===== */
  const { unclassified, classified } = useMemo(() => {
    const uncl: Video[] = [];
    const cl: Video[] = [];
    videos.forEach((v) => {
      if (v.type !== activeType) return;
      if (!v.matchedCategories || v.matchedCategories.length === 0) {
        uncl.push(v);
      } else {
        cl.push(v);
      }
    });
    return { unclassified: uncl, classified: cl };
  }, [videos, activeType]);

  /** 依右側分類篩選 */
  const filteredClassified = useMemo(() => {
    if (rightFilter === '全部') return classified;
    return classified.filter((v) =>
      v.matchedCategories?.includes(rightFilter as MainCategory)
    );
  }, [classified, rightFilter]);

  /** ===== Handler ===== */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  /** ===== Render ===== */
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* ===== 未分類左欄 ===== */}
      <section className="border p-2 rounded-lg">
        <header className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">
            未分類 ({unclassified.length})
          </h2>
          <button
            disabled={selectedIds.size === 0}
            className="text-sm text-blue-600 disabled:text-gray-400"
            onClick={() => setModalOpen(true)}
          >
            套用至分類 ▶
          </button>
        </header>

        <ul className="space-y-1 max-h-[60vh] overflow-auto pr-1">
          {unclassified.map((v) => (
            <li
              key={v.videoId}
              className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded"
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
            </li>
          )}
        </ul>
      </section>

      {/* ===== 已分類右欄 ===== */}
      <section className="border p-2 rounded-lg">
        <header className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">
            已分類 ({classified.length})
          </h2>

          {/* 主分類 Filter Tabs */}
          <div className="flex space-x-1">
            {mainCategories.map((cat) => (
              <button
                key={cat}
                className={`px-2 py-0.5 text-xs rounded ${
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

        <ul className="space-y-1 max-h-[60vh] overflow-auto pr-1">
          {filteredClassified.map((v) => (
            <li
              key={v.videoId}
              className="flex items-start gap-2 bg-white/50 dark:bg-gray-800 p-1 rounded"
            >
              <span className="text-sm flex-1">{v.title}</span>

              {/* 顯示多枚徽章 */}
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
      </section>

      {/* ===== Apply Modal ===== */}
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
