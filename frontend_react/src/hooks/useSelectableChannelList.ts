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
  active_time_all?: {
    凌: number;
    早: number;
    午: number;
    晚: number;
    totalCount: number;
    updatedAt?: string;
  };
};

const normalize = (text: string) =>
  text.toLowerCase().replace(/\s/g, '').replace(/　/g, ''); // 全形空白也移除

const ACTIVE_TIME_FIELD_MAP = {
  midnight: '凌',
  morning: '早',
  afternoon: '午',
  evening: '晚',
} as const;

export type ActiveTimePeriod = keyof typeof ACTIVE_TIME_FIELD_MAP;

export function useSelectableChannelList(
  searchText: string = '',
  sortMode: 'latest' | 'alphabetical' | 'activeTime' = 'latest',
  activeTimePeriod: ActiveTimePeriod = 'midnight'
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

      if (sortMode === 'activeTime') {
        const key = ACTIVE_TIME_FIELD_MAP[activeTimePeriod];
        const getRatio = (c: ChannelIndexEntry): number => {
          const act = c.active_time_all;
          if (!act || !act[key] || !act.totalCount) return 0;
          return act[key] / act.totalCount;
        };

        const ratioA = getRatio(a);
        const ratioB = getRatio(b);

        if (ratioA !== ratioB) {
          return ratioB - ratioA; // 高 → 低
        }

        const timeA = a.lastVideoUploadedAt ? new Date(a.lastVideoUploadedAt).getTime() : 0;
        const timeB = b.lastVideoUploadedAt ? new Date(b.lastVideoUploadedAt).getTime() : 0;

        if (timeA !== timeB) {
          return timeB - timeA; // 新 → 舊
        }

        return aPriority - bPriority;
      }

      // latest & alphabetical 共用 priority 第一順位
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
  }, [searchText, sortMode, activeTimePeriod, allChannels]);

  return {
    isLoading,
    error,
    channels: filtered,
    newlyJoinedChannels,
  };
}
