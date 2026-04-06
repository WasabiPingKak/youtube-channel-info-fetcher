import React, { useEffect, useRef } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import {
  showPermissionDeniedToast,
} from "@/components/common/ToastManager";

import { useMyChannelId } from "@/hooks/useMyChannelId";
import { useChannelIndex } from "@/hooks/useChannelIndex";
import MainLayout from "../components/layout/MainLayout";
import VideoExplorerContent from "./VideoExplorerContent";

const ADMIN_CHANNEL_ID = import.meta.env.VITE_ADMIN_CHANNEL_ID;

const VideoExplorerPage = () => {
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channel") || ADMIN_CHANNEL_ID;

  const { data: me, isLoading: meLoading } = useMyChannelId();
  const { data: channelInfo, isLoading: infoLoading } = useChannelIndex(channelId);

  // 載入中
  if (meLoading || infoLoading) {
    return (
      <MainLayout>
        <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
          載入中...
        </div>
      </MainLayout>
    );
  }

  if (!channelInfo) {
    return (
      <MainLayout>
        <div className="px-4 py-10 text-center text-red-500 dark:text-red-400">
          載入頻道資訊失敗
        </div>
      </MainLayout>
    );
  }

  const isOwner = me?.channelId === channelId;
  const isPublic = channelInfo?.enabled !== false;

  if (!isPublic && !isOwner) {
    return <PermissionRedirect />;
  }

  return <VideoExplorerContent channelId={channelId} />;
};

/**
 * 權限不足時顯示 toast 並導向首頁。
 * 用 useEffect 確保 toast 只觸發一次，用 Navigate 處理跳轉。
 */
const PermissionRedirect = () => {
  const toastShown = useRef(false);

  useEffect(() => {
    if (!toastShown.current) {
      showPermissionDeniedToast("您沒有權限查看這個頻道頁面");
      toastShown.current = true;
    }
  }, []);

  return <Navigate to="/" replace />;
};

export default VideoExplorerPage;
