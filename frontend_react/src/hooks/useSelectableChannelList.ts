import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || "";

export type ChannelIndexEntry = {
  channel_id: string;
  name: string;
  url: string;
  thumbnail: string;
  priority?: number;
  enabled?: boolean;
  joinedAt?: string;
  countryCode?: string[];
  lastVideoUploadedAt?: string;
};

const normalize = (text: string) =>
  text.toLowerCase().replace(/\s/g, '').replace(/　/g, ''); // 全形空白也移除

export function useSelectableChannelList(
  searchText: string = '',
  sortMode: 'latest' | 'alphabetical' = 'latest'
) {
  const {
    data: allChannelsData,
    isLoading,
    error,
  } = useQuery<{ channels: ChannelIndexEntry[]; newly_joined_channels: ChannelIndexEntry[] }>({
    queryKey: ['selectable-channel-list'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/channels/index`);
      if (!res.ok) {
        throw new Error(`API 錯誤：${res.status}`);
      }
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || '無法取得頻道清單');
      }
      return {
        channels: result.channels,
        newly_joined_channels: result.newly_joined_channels || [],
      };
    },
    // gcTime: 1000 * 60 * 3, // 快取 3 分鐘
  });

  const allChannels = allChannelsData?.channels || [];
  const newlyJoinedChannels = searchText === "" ? (allChannelsData?.newly_joined_channels || []) : [];

  const filtered = useMemo(() => {
    const norm = normalize(searchText);

    const matched = !searchText
      ? allChannels
      : allChannels.filter((c) => normalize(c.name).includes(norm));

    return matched.slice().sort((a, b) => {
      const aPriority = a.priority ?? 0;
      const bPriority = b.priority ?? 0;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      if (sortMode === 'alphabetical') {
        return a.name.localeCompare(b.name, 'zh-Hant');
      }

      // sortMode === 'latest'
      const aTime = a.lastVideoUploadedAt ? new Date(a.lastVideoUploadedAt).getTime() : 0;
      const bTime = b.lastVideoUploadedAt ? new Date(b.lastVideoUploadedAt).getTime() : 0;

      return bTime - aTime; // 新→舊
    });
  }, [searchText, sortMode, allChannels]);

  return {
    isLoading,
    error,
    channels: filtered,
    newlyJoinedChannels,
  };
}
