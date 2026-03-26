export type LiveInfo = {
    videoId: string;
    title: string;
    startTime: string;
    viewers: number;
    isUpcoming: boolean;
    endTime: string | null;
};

export type LiveChannelData = {
    channel_id: string;
    name: string;
    thumbnail: string;
    badge: string;
    countryCode: string[];
    live: LiveInfo;
};

export type LiveRedirectCacheResponse = {
    updatedAt: string;
    channels: LiveChannelData[];
};
