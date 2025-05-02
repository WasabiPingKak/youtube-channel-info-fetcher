/**
 * EditorLayout
 * ------------
 * CategoryEditorV2 外框：
 * 1. 讀取 editor-data → 注入 Zustand Store
 * 2. 顯示頻道資訊 (ChannelInfoCard)
 * 3. 頂層 Tabs：live / videos / shorts
 * 4. SaveAllButton（佔位）
 * 5. Slot 放置子元件 (VideoDualList 等)
 */

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorData } from '../hooks/useEditorData';
import { useEditorStore } from '../hooks/useEditorStore';

import ChannelInfoCard from '../../common/ChannelInfoCard'; // 已存在元件
import ChannelDrawer from '../../common/ChannelDrawer'; // ✅ 頻道側邊欄
import SaveAllButton from './SaveAllButton';
import VideoDualList from './VideoDualList';
import GameTagTable from './GameTagTable'; // ✅ 新增匯入

const typeTabs: { key: 'live' | 'videos' | 'shorts'; label: string }[] = [
  { key: 'live', label: '直播' },
  { key: 'videos', label: '影片' },
  { key: 'shorts', label: 'Shorts' },
];

export default function EditorLayout() {
  // 1. 從路由取得 channelId（/editor/:channelId）
  const { channelId } = useParams<{ channelId: string }>();

  // 2. TanStack Query 讀取資料
  const { data, isLoading, isError, error } = useEditorData(channelId);

  // 3. 注入 Zustand Store
  const setChannelId = useEditorStore((s) => s.setChannelId);
  const setConfig = useEditorStore((s) => s.setConfig);
  const setVideos = useEditorStore((s) => s.setVideos);

  useEffect(() => {
    if (data && channelId) {
      setChannelId(channelId);
      setConfig(data.config);
      setVideos(data.videos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, channelId]);

  const activeType = useEditorStore((s) => s.activeType);
  const setActiveType = useEditorStore((s) => s.setActiveType);
  const unsaved = useEditorStore((s) => s.unsaved);

  // Render Logic
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="animate-spin mr-2">⏳</span>
        Loading…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600">
        無法載入資料：{(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-6xl mx-auto">
      {/* 頻道資訊卡 */}
      <ChannelDrawer />
      <ChannelInfoCard />

      {/* Tabs + Save 按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {typeTabs.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-1 rounded-full text-sm ${
                activeType === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onClick={() => setActiveType(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SaveAllButton disabled={!unsaved} />
      </div>

      {/* 主要編輯區塊 */}
      <VideoDualList />

      {/* 遊戲標籤管理器 */}
      <GameTagTable />
    </div>
  );
}