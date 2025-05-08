import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorData } from '../hooks/useEditorData';
import { useEditorVideos } from '../hooks/useEditorVideos';
import { useEditorStore } from '../hooks/useEditorStore';
import { Toaster } from 'react-hot-toast';
import { useChannelList } from '../../../hooks/useChannelList';
import type { VideoType } from '../types/editor';

import ChannelInfoCard from '../../common/ChannelInfoCard';
import ChannelDrawer from '../../common/ChannelDrawer';
import SaveAllButton from './SaveAllButton';
import KeywordSuggestPanel from './KeywordSuggestPanel';
import FilteredVideoList from './FilteredVideoList';
import VideoTypeTabs from './VideoTypeTabs';

const TYPE_MAP: Record<string, VideoType> = {
  "直播檔": "live",
  "影片": "videos",
  "Shorts": "shorts",
};

export default function EditorLayout() {
  const { channelId } = useParams<{ channelId: string }>();
  const {
    data: configData,
    isLoading: isLoadingConfig,
    isError: isErrorConfig,
    error: errorConfig,
  } = useEditorData(channelId);
  const {
    data: videosData,
    isLoading: isLoadingVideos,
    isError: isErrorVideos,
    error: errorVideos,
  } = useEditorVideos(channelId);

  const setChannelId = useEditorStore((s) => s.setChannelId);
  const setConfig = useEditorStore((s) => s.setConfig);
  const setVideos = useEditorStore((s) => s.setVideos);
  const unsaved = useEditorStore((s) => s.unsaved);

  const { data: channelList = [] } = useChannelList();

  useEffect(() => {
    if (channelId) {
      setChannelId(channelId);
    }
    if (configData) {
      setConfig(configData.config);
    }
    if (videosData) {
      if (videosData) {
        const enriched = videosData.map((v) => ({
          ...v,
          type: TYPE_MAP[v.type] ?? v.type, // ⬅️ 轉成英文代碼
        }));
        setVideos(enriched);
      }

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, configData, videosData]);

  const isLoading = isLoadingConfig || isLoadingVideos;
  const isError = isErrorConfig || isErrorVideos;
  const errorMessage =
    (errorConfig as Error)?.message || (errorVideos as Error)?.message;

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
        無法載入資料：{errorMessage || 'Unknown error'}
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex flex-col gap-4 px-4 py-6 max-w-6xl mx-auto">
        <ChannelDrawer />
        <ChannelInfoCard />
        <KeywordSuggestPanel />
        <VideoTypeTabs />

        <div className="flex justify-end">
          <SaveAllButton disabled={!unsaved} />
        </div>

        <div className="min-h-[600px]">
          <FilteredVideoList />
        </div>
      </div>
    </>
  );
}
