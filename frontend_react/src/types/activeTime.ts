export type ActiveTimeMatrix = Record<string, Record<string, number>>;

export interface ActiveTimeChannel {
    channelId: string;
    name: string;
    thumbnail: string;
    countryCode: string[];
    activeTime: ActiveTimeMatrix;
    totalCount: number;
}

export interface ActiveTimeResponse {
    generatedAt: string;
    version: number;
    channels: ActiveTimeChannel[];
}
