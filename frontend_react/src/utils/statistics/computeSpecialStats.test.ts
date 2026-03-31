import { computeSpecialStats } from './computeSpecialStats';
import type { ClassifiedVideoItem } from '@/hooks/useAnnualReviewData';

const makeVideo = (overrides: Partial<ClassifiedVideoItem>): ClassifiedVideoItem => ({
    videoId: 'v1',
    title: 'test',
    publishDate: '2025-03-15T10:00:00Z',
    duration: 3600,
    type: 'live',
    matchedCategories: [],
    ...overrides,
});

describe('computeSpecialStats', () => {
    // ===== 無直播 =====

    describe('無直播影片', () => {
        it('應回傳全部 null/0/空陣列的預設值', () => {
            const result = computeSpecialStats([]);
            expect(result.longestLive).toBeNull();
            expect(result.longestLiveStreak).toBeNull();
            expect(result.topLiveGames).toEqual([]);
            expect(result.distinctGameCount).toBe(0);
            expect(result.distinctGameList).toEqual([]);
        });

        it('僅有非 live 類型時也應回傳預設值', () => {
            const videos = [
                makeVideo({ type: 'videos' }),
                makeVideo({ type: 'shorts' }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.longestLive).toBeNull();
        });
    });

    // ===== 最長直播 =====

    describe('最長直播', () => {
        it('應找出 duration 最大的直播', () => {
            const videos = [
                makeVideo({ videoId: 'short', duration: 1800, title: '短直播' }),
                makeVideo({ videoId: 'long', duration: 7200, title: '長直播' }),
                makeVideo({ videoId: 'mid', duration: 3600, title: '中直播' }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.longestLive).not.toBeNull();
            expect(result.longestLive!.videoId).toBe('long');
            expect(result.longestLive!.duration).toBe(7200);
            expect(result.longestLive!.title).toBe('長直播');
        });
    });

    // ===== 最長連續直播天數 =====

    describe('最長連續直播天數', () => {
        it('應正確計算連續天數（GMT+8）', () => {
            // 連續 3 天: 3/15, 3/16, 3/17（Taipei 時間）
            const videos = [
                makeVideo({ videoId: 'v1', publishDate: '2025-03-15T10:00:00Z' }),
                makeVideo({ videoId: 'v2', publishDate: '2025-03-16T10:00:00Z' }),
                makeVideo({ videoId: 'v3', publishDate: '2025-03-17T10:00:00Z' }),
                // 中斷一天後
                makeVideo({ videoId: 'v4', publishDate: '2025-03-19T10:00:00Z' }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.longestLiveStreak).not.toBeNull();
            expect(result.longestLiveStreak!.days).toBe(3);
            expect(result.longestLiveStreak!.startDate).toBe('2025-03-15');
            expect(result.longestLiveStreak!.endDate).toBe('2025-03-17');
        });

        it('items 應依日期升冪排列', () => {
            const videos = [
                makeVideo({ videoId: 'v2', publishDate: '2025-03-16T10:00:00Z' }),
                makeVideo({ videoId: 'v1', publishDate: '2025-03-15T10:00:00Z' }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.longestLiveStreak!.items[0].videoId).toBe('v1');
            expect(result.longestLiveStreak!.items[1].videoId).toBe('v2');
        });

        it('單場直播應算 1 天連續', () => {
            const videos = [
                makeVideo({ videoId: 'v1', publishDate: '2025-03-15T10:00:00Z' }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.longestLiveStreak!.days).toBe(1);
        });

        it('天數相同時應選總時數較多的區間', () => {
            const videos = [
                // 區間 A: 2 天，總時數 2hr
                makeVideo({ videoId: 'a1', publishDate: '2025-03-01T10:00:00Z', duration: 3600 }),
                makeVideo({ videoId: 'a2', publishDate: '2025-03-02T10:00:00Z', duration: 3600 }),
                // 區間 B: 2 天，總時數 10hr
                makeVideo({ videoId: 'b1', publishDate: '2025-03-10T10:00:00Z', duration: 18000 }),
                makeVideo({ videoId: 'b2', publishDate: '2025-03-11T10:00:00Z', duration: 18000 }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.longestLiveStreak!.days).toBe(2);
            expect(result.longestLiveStreak!.totalDuration).toBe(36000); // 區間 B
        });
    });

    // ===== Top 5 遊戲 =====

    describe('Top 5 遊戲', () => {
        it('應依累計直播秒數降冪排列', () => {
            const videos = [
                makeVideo({ game: 'Minecraft', duration: 7200 }),
                makeVideo({ game: 'Minecraft', duration: 3600 }),
                makeVideo({ game: 'Valorant', duration: 5400 }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.topLiveGames[0].game).toBe('Minecraft');
            expect(result.topLiveGames[0].totalDuration).toBe(10800);
            expect(result.topLiveGames[1].game).toBe('Valorant');
        });

        it('應只取前 5 名', () => {
            const games = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            const videos = games.map((g, i) =>
                makeVideo({ videoId: `v${i}`, game: g, duration: (games.length - i) * 1000 })
            );
            const result = computeSpecialStats(videos);
            expect(result.topLiveGames).toHaveLength(5);
        });

        it('game 為空/null/undefined 的影片應被排除', () => {
            const videos = [
                makeVideo({ game: '', duration: 9999 }),
                makeVideo({ game: null, duration: 9999 }),
                makeVideo({ game: undefined, duration: 9999 }),
                makeVideo({ game: 'Minecraft', duration: 3600 }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.topLiveGames).toHaveLength(1);
            expect(result.topLiveGames[0].game).toBe('Minecraft');
        });
    });

    // ===== 不重複遊戲數 =====

    describe('不重複遊戲數', () => {
        it('應回傳不重複遊戲數量', () => {
            const videos = [
                makeVideo({ game: 'Minecraft' }),
                makeVideo({ game: 'Minecraft' }),
                makeVideo({ game: 'Valorant' }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.distinctGameCount).toBe(2);
        });

        it('distinctGameList 應按字母排序', () => {
            const videos = [
                makeVideo({ game: 'Zelda' }),
                makeVideo({ game: 'Apex' }),
                makeVideo({ game: 'Minecraft' }),
            ];
            const result = computeSpecialStats(videos);
            expect(result.distinctGameList).toEqual(['Apex', 'Minecraft', 'Zelda']);
        });
    });
});
