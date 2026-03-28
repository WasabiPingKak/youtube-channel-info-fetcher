import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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

  const { data: me, isLoading: meLoading, error: meError } = useMyChannelId();
  const { data: channelInfo, isLoading: infoLoading } = useChannelIndex(channelId);

  const navigate = useNavigate();

  // 🔒 權限判斷：非本人 + 非公開 → 導回首頁
  useEffect(() => {
    if (!meLoading && !infoLoading) {
      const isOwner = me?.channelId === channelId;
      const isPublic = channelInfo?.enabled !== false;
      const allowAccess = isPublic || isOwner;

      if (!allowAccess) {
        showPermissionDeniedToast("您沒有權限查看這個頻道頁面");
        navigate("/");
      }
    }
  }, [meLoading, infoLoading, me, meError, channelInfo, channelId, navigate]);

  // 🌀 初次載入中
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
    return null; // toast + redirect 已處理
  }

  return <VideoExplorerContent channelId={channelId} />;
};

export default VideoExplorerPage;
