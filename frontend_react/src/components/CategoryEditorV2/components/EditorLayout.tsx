// EditorLayout.tsx
/**
 * EditorLayout
 * ------------
 * CategoryEditorV2 外框：
 * 1. 讀取 editor-data → 注入 Zustand Store
 * 2. 顯示頻道資訊 (ChannelInfoCard)
 * 3. SaveAllButton
 * 4. 關鍵字建議與編輯（KeywordSuggestPanel）
 * 5. 類型 Tabs（VideoTypeTabs） → 影片編輯清單（VideoDualList）
 */

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorData } from '../hooks/useEditorData';
import { useEditorStore } from '../hooks/useEditorStore';
import { Toaster } from 'react-hot-toast';
import { useChannelList } from '../../../hooks/useChannelList';

import ChannelInfoCard from '../../common/ChannelInfoCard';
import ChannelDrawer from '../../common/ChannelDrawer';
import SaveAllButton from './SaveAllButton';
import KeywordSuggestPanel from './KeywordSuggestPanel';
import FilteredVideoList from './FilteredVideoList';
import VideoTypeTabs from './VideoTypeTabs';

export default function EditorLayout() {
  const { channelId } = useParams<{ channelId: string }>();
  const { data, isLoading, isError, error } = useEditorData(channelId);

  const setChannelId = useEditorStore((s) => s.setChannelId);
  const setConfig = useEditorStore((s) => s.setConfig);
  const setVideos = useEditorStore((s) => s.setVideos);
  const unsaved = useEditorStore((s) => s.unsaved);

  // 取得頻道清單以獲取目前頻道名稱
  const { data: channelList = [] } = useChannelList();

  useEffect(() => {
    if (data && channelId) {
      setChannelId(channelId);
      setConfig(data.config);
      setVideos(data.videos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, channelId]);

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
    <>
      {/* Toaster 用於顯示所有 toast */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex flex-col gap-4 px-4 py-6 max-w-6xl mx-auto">
        {/* 側邊抽屜：選擇頻道 */}
        <ChannelDrawer />

        {/* 頻道資訊卡 */}
        <ChannelInfoCard />

        {/* 自動建議區塊 */}
        <KeywordSuggestPanel />

        {/* 類型切換 Tab */}
        <VideoTypeTabs />

        {/* 儲存按鈕 */}
        <div className="flex justify-end">
          <SaveAllButton disabled={!unsaved} />
        </div>

        {/* 影片編輯清單 */}
        <div className="min-h-[600px]">
          <FilteredVideoList />
        </div>
      </div>
    </>
  );
}
