import { buildSuggestedKeywordCards } from './keywordCardBuilder';
import type { ClassifiedVideoItem } from '@/types/category';

// ===== 測試資料 =====

const makeVideo = (overrides: Partial<ClassifiedVideoItem>): ClassifiedVideoItem => ({
    videoId: 'v1',
    title: 'untitled',
    publishDate: '2025-01-01',
    duration: 3600,
    type: 'live',
    matchedCategories: [],
    ...overrides,
});

const videos: ClassifiedVideoItem[] = [
    makeVideo({ videoId: 'v1', title: '今天來玩 Minecraft 生存' }),
    makeVideo({ videoId: 'v2', title: 'Minecraft Party 大亂鬥' }),
    makeVideo({ videoId: 'v3', title: '唱歌雜談 singing stream' }),
];

describe('buildSuggestedKeywordCards', () => {
    it('應正確匹配關鍵字到影片標題（使用 normalize）', () => {
        const result = buildSuggestedKeywordCards(
            [{ keyword: 'minecraft', count: 5 }],
            videos,
            [],
            new Map(),
        );
        expect(result).toHaveLength(1);
        expect(result[0].matchedVideos).toHaveLength(2);
        expect(result[0].matchedVideos.map((v) => v.videoId).sort()).toEqual(['v1', 'v2']);
    });

    it('未匹配任何影片的關鍵字仍應出現在結果中', () => {
        const result = buildSuggestedKeywordCards(
            [{ keyword: 'unknown_keyword', count: 10 }],
            videos,
            [],
            new Map(),
        );
        expect(result).toHaveLength(1);
        expect(result[0].matchedVideos).toHaveLength(0);
    });

    it('skipKeywords 中的關鍵字應標記為 skipped', () => {
        const result = buildSuggestedKeywordCards(
            [{ keyword: 'singing', count: 3 }],
            videos,
            ['singing'],
            new Map(),
        );
        expect(result[0].skipped).toBe(true);
    });

    it('非 skipKeywords 的關鍵字不應標記為 skipped', () => {
        const result = buildSuggestedKeywordCards(
            [{ keyword: 'minecraft', count: 5 }],
            videos,
            ['singing'],
            new Map(),
        );
        expect(result[0].skipped).toBe(false);
    });

    it('configMap 中有對應時應設定 agreed/isSuccess/isSaving/mainCategories/subcategoryName', () => {
        const configMap = new Map([
            ['minecraft', [{ mainCategory: '遊戲', subcategoryName: 'Minecraft' }]],
        ]);
        const result = buildSuggestedKeywordCards(
            [{ keyword: 'minecraft', count: 5 }],
            videos,
            [],
            configMap,
        );
        expect(result[0].agreed).toBe(true);
        expect(result[0].isSuccess).toBe(true);
        expect(result[0].isSaving).toBe(true);
        expect(result[0].mainCategories).toEqual(['遊戲']);
        expect(result[0].subcategoryName).toBe('Minecraft');
    });

    it('configMap 無對應時 subcategoryName 應 fallback 為 keyword', () => {
        const result = buildSuggestedKeywordCards(
            [{ keyword: 'singing', count: 3 }],
            videos,
            [],
            new Map(),
        );
        expect(result[0].subcategoryName).toBe('singing');
        expect(result[0].agreed).toBe(false);
    });

    describe('排序邏輯', () => {
        it('應先依匹配影片數降冪排序', () => {
            const result = buildSuggestedKeywordCards(
                [
                    { keyword: 'singing', count: 10 },   // 匹配 1 部
                    { keyword: 'minecraft', count: 1 },   // 匹配 2 部
                ],
                videos,
                [],
                new Map(),
            );
            expect(result[0].keyword).toBe('minecraft'); // 2 > 1
            expect(result[1].keyword).toBe('singing');
        });

        it('匹配數相同時依 count 降冪排序', () => {
            const result = buildSuggestedKeywordCards(
                [
                    { keyword: 'aaa', count: 3 },  // 匹配 0 部
                    { keyword: 'bbb', count: 10 }, // 匹配 0 部
                ],
                videos,
                [],
                new Map(),
            );
            expect(result[0].keyword).toBe('bbb'); // count 10 > 3
            expect(result[1].keyword).toBe('aaa');
        });

        it('兩者皆相同時依 keyword 字母升冪排序', () => {
            const result = buildSuggestedKeywordCards(
                [
                    { keyword: 'zzz', count: 5 },
                    { keyword: 'aaa', count: 5 },
                ],
                videos,
                [],
                new Map(),
            );
            expect(result[0].keyword).toBe('aaa');
            expect(result[1].keyword).toBe('zzz');
        });
    });

    it('空 mergedKeywords 應回傳空陣列', () => {
        const result = buildSuggestedKeywordCards([], videos, [], new Map());
        expect(result).toEqual([]);
    });
});
