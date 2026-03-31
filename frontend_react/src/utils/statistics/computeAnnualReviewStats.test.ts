import { normalizeType, computeAnnualReviewStats } from './computeAnnualReviewStats';
import type { ClassifiedVideoItem } from '@/hooks/useAnnualReviewData';

// ===== normalizeType =====

describe('normalizeType', () => {
    it('應將中文「直播檔」「直播」轉為 "live"', () => {
        expect(normalizeType('直播檔')).toBe('live');
        expect(normalizeType('直播')).toBe('live');
    });

    it('應將英文 "live" 轉為 "live"', () => {
        expect(normalizeType('live')).toBe('live');
    });

    it('應將中文「影片」轉為 "videos"', () => {
        expect(normalizeType('影片')).toBe('videos');
    });

    it('應將 "video" 和 "videos" 都轉為 "videos"', () => {
        expect(normalizeType('video')).toBe('videos');
        expect(normalizeType('videos')).toBe('videos');
    });

    it('應將中文「短片」和 "shorts" 轉為 "shorts"', () => {
        expect(normalizeType('短片')).toBe('shorts');
        expect(normalizeType('shorts')).toBe('shorts');
    });

    it('應處理大小寫混合', () => {
        expect(normalizeType('Live')).toBe('live');
        expect(normalizeType('VIDEOS')).toBe('videos');
        expect(normalizeType('Shorts')).toBe('shorts');
    });

    it('應處理前後空白', () => {
        expect(normalizeType('  live  ')).toBe('live');
        expect(normalizeType(' 直播 ')).toBe('live');
    });

    it('空字串應回傳 null', () => {
        expect(normalizeType('')).toBeNull();
    });

    it('未知類型應回傳 null', () => {
        expect(normalizeType('podcast')).toBeNull();
        expect(normalizeType('unknown')).toBeNull();
    });
});

// ===== computeAnnualReviewStats =====

const makeVideo = (overrides: Partial<ClassifiedVideoItem>): ClassifiedVideoItem => ({
    videoId: 'v1',
    title: 'test',
    publishDate: '2025-03-15T10:00:00Z',
    duration: 3600,
    type: 'live',
    matchedCategories: [],
    ...overrides,
});

describe('computeAnnualReviewStats', () => {
    it('應正確計算各類型影片數量', () => {
        const videos = [
            makeVideo({ videoId: 'v1', type: 'live' }),
            makeVideo({ videoId: 'v2', type: 'live' }),
            makeVideo({ videoId: 'v3', type: 'videos' }),
            makeVideo({ videoId: 'v4', type: 'shorts' }),
        ];
        const { stats } = computeAnnualReviewStats(videos);
        expect(stats.videoCounts).toEqual({ live: 2, videos: 1, shorts: 1 });
    });

    it('應正確計算總直播時數（四捨五入至小時）', () => {
        const videos = [
            makeVideo({ type: 'live', duration: 3600 }),  // 1hr
            makeVideo({ type: 'live', duration: 5400 }),  // 1.5hr
        ];
        const { stats } = computeAnnualReviewStats(videos);
        // (3600 + 5400) / 3600 = 2.5 → Math.round = 3
        expect(stats.totalLiveHours).toBe(3);
    });

    it('應正確計算不重複直播天數', () => {
        // 兩場直播在同一天（Taipei 時間）
        const videos = [
            makeVideo({ videoId: 'v1', type: 'live', publishDate: '2025-03-15T10:00:00Z' }),
            makeVideo({ videoId: 'v2', type: 'live', publishDate: '2025-03-15T14:00:00Z' }),
            makeVideo({ videoId: 'v3', type: 'live', publishDate: '2025-03-16T10:00:00Z' }),
        ];
        const { stats } = computeAnnualReviewStats(videos);
        expect(stats.totalLiveDays).toBe(2); // 3/15 和 3/16
    });

    it('應產生 12 個月的月度統計（含零值月份）', () => {
        const videos = [
            makeVideo({ type: 'live', publishDate: '2025-03-15T10:00:00Z' }),
        ];
        const { stats } = computeAnnualReviewStats(videos);
        expect(stats.monthlyVideoCounts).toHaveLength(12);
        // 三月應有 1 筆 live
        expect(stats.monthlyVideoCounts[2]).toEqual({ month: 3, shorts: 0, videos: 0, live: 1 });
        // 其他月份為 0
        expect(stats.monthlyVideoCounts[0]).toEqual({ month: 1, shorts: 0, videos: 0, live: 0 });
    });

    it('應正確統計分類累計秒數', () => {
        const videos = [
            makeVideo({ type: 'live', duration: 3600, matchedCategories: ['遊戲', '雜談'] }),
            makeVideo({ type: 'live', duration: 1800, matchedCategories: ['遊戲'] }),
        ];
        const { stats } = computeAnnualReviewStats(videos);
        const gameCategory = stats.categoryTime.find((c) => c.category === '遊戲');
        const chatCategory = stats.categoryTime.find((c) => c.category === '雜談');
        expect(gameCategory?.seconds).toBe(5400);
        expect(chatCategory?.seconds).toBe(3600);
    });

    it('非 live 類型不應計入分類累計', () => {
        const videos = [
            makeVideo({ type: 'videos', duration: 3600, matchedCategories: ['遊戲'] }),
        ];
        const { stats } = computeAnnualReviewStats(videos);
        expect(stats.categoryTime).toHaveLength(0);
    });

    it('空陣列應回傳全零統計', () => {
        const { stats } = computeAnnualReviewStats([]);
        expect(stats.videoCounts).toEqual({ shorts: 0, videos: 0, live: 0 });
        expect(stats.totalLiveHours).toBe(0);
        expect(stats.totalLiveDays).toBe(0);
        expect(stats.monthlyVideoCounts).toHaveLength(12);
        expect(stats.categoryTime).toHaveLength(0);
    });

    it('應包含 special 欄位', () => {
        const { special } = computeAnnualReviewStats([]);
        expect(special).toBeDefined();
        expect(special.longestLive).toBeNull();
    });
});
