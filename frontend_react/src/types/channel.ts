/** 前端使用的頻道清單物件 */
export interface ChannelListItem {
    /** Firestore 文件 ID（即 YouTube channelId） */
    id: string;
    /** 頻道名稱 */
    name: string;
    /** YouTube 頭像 URL */
    thumbnail: string;
    /** YouTube 頻道首頁 URL */
    url: string;
    /** 排序值；數字越小越前面（可選） */
    priority?: number;
}

export interface ChannelIndexInfo {
    name: string;
    url: string;
    thumbnail: string;
    countryCode: string[];
    enabled: boolean;
    priority: number;
}

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
