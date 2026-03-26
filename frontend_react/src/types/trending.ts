export interface VideoItem {
    videoId: string;
    channelId: string;
    title: string;
    publishDate: string;
    type: string;
}

export interface SummaryStats {
    [game: string]: {
        videoCount: number;
        channelCount: number;
    };
}

export interface ChartDataPoint {
    date: string;
    [game: string]: number | string;
}

export interface ChannelVideoGroup {
    channelName: string;
    videos: {
        id: string;
        title: string;
        publishedAt: string;
        thumbnail: string;
        url: string;
    }[];
}

export interface TrendingGamesResponse {
    dates: string[];
    gameList: string[];
    videoCountByGameAndDate: {
        [game: string]: {
            [date: string]: number;
        };
    };
    contributorsByDateAndGame: {
        [date: string]: {
            [game: string]: {
                [channelId: string]: {
                    channelName: string;
                    count: number;
                };
            };
        };
    };
    details: {
        [game: string]: {
            [channelId: string]: ChannelVideoGroup;
        };
    };
    channelInfo: {
        [channelId: string]: {
            name: string;
            thumbnail: string;
            url: string;
        };
    };
}
