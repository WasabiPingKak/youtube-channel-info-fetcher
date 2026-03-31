import { filterAndSortAliases } from './filterAndSortAliases';
import type { SortOption } from './filterAndSortAliases';

// ===== 測試資料 =====

const flatData = {
    'Bob': ['B1'],
    'Alice': ['A1', 'A2'],
    'Charlie': ['C1', 'C2', 'C3'],
};

const nestedData = {
    '遊戲': {
        'MC': ['Minecraft', 'mc'],
        'LOL': ['League'],
    },
    '音樂': {
        '唱歌': ['sing', 'singing'],
    },
};

describe('filterAndSortAliases', () => {
    // ===== null / undefined 安全 =====

    describe('null / undefined 安全', () => {
        it('data 為 null 時，flat 模式回傳空陣列', () => {
            const result = filterAndSortAliases({
                data: null, mode: 'flat', searchText: '', sortOption: 'name-asc',
            });
            expect(result).toEqual([]);
        });

        it('data 為 null 時，nested 模式回傳空物件', () => {
            const result = filterAndSortAliases({
                data: null, mode: 'nested', searchText: '', sortOption: 'name-asc',
            });
            expect(result).toEqual({});
        });

        it('data 為 undefined 時應安全處理', () => {
            const result = filterAndSortAliases({
                data: undefined, mode: 'flat', searchText: '', sortOption: 'name-asc',
            });
            expect(result).toEqual([]);
        });
    });

    // ===== flat 模式 =====

    describe('flat 模式', () => {
        it('無搜尋文字時應回傳全部項目', () => {
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: '', sortOption: 'name-asc',
            });
            expect(result).toHaveLength(3);
        });

        it('應依名稱進行不分大小寫搜尋', () => {
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: 'alice', sortOption: 'name-asc',
            });
            expect(result).toHaveLength(1);
            expect((result as { name: string }[])[0].name).toBe('Alice');
        });

        it('應依別名進行搜尋', () => {
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: 'C2', sortOption: 'name-asc',
            });
            expect(result).toHaveLength(1);
            expect((result as { name: string }[])[0].name).toBe('Charlie');
        });

        it('name-asc 排序應按名稱升冪', () => {
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: '', sortOption: 'name-asc',
            }) as { name: string }[];
            expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        it('name-desc 排序應按名稱降冪', () => {
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: '', sortOption: 'name-desc',
            }) as { name: string }[];
            expect(result.map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice']);
        });

        it('alias-more 排序應依別名數量降冪', () => {
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: '', sortOption: 'alias-more',
            }) as { name: string; aliases: string[] }[];
            expect(result[0].name).toBe('Charlie'); // 3 aliases
            expect(result[2].name).toBe('Bob');     // 1 alias
        });

        it('alias-less 排序應依別名數量升冪', () => {
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: '', sortOption: 'alias-less',
            }) as { name: string; aliases: string[] }[];
            expect(result[0].name).toBe('Bob');     // 1 alias
            expect(result[2].name).toBe('Charlie'); // 3 aliases
        });

        it('搜尋 + 排序應同時生效', () => {
            // A1, A2 匹配 'A'；Alice 也匹配 'A' → 只剩 Alice
            // Bob 的 B1 不匹配；Charlie 的 C1/C2/C3 不匹配
            const result = filterAndSortAliases({
                data: flatData, mode: 'flat', searchText: 'A', sortOption: 'name-asc',
            }) as { name: string }[];
            // Alice 名稱含 A，Charlie 的 alias 不含 A
            expect(result.some((r) => r.name === 'Alice')).toBe(true);
        });
    });

    // ===== nested 模式 =====

    describe('nested 模式', () => {
        it('應回傳巢狀結構', () => {
            const result = filterAndSortAliases({
                data: nestedData, mode: 'nested', searchText: '', sortOption: 'name-asc',
            }) as Record<string, [string, string[]][]>;
            expect(Object.keys(result)).toContain('遊戲');
            expect(Object.keys(result)).toContain('音樂');
        });

        it('skipTopLevelKey 應排除指定分類', () => {
            const result = filterAndSortAliases({
                data: nestedData,
                mode: 'nested',
                searchText: '',
                sortOption: 'name-asc',
                skipTopLevelKey: '遊戲',
            }) as Record<string, [string, string[]][]>;
            expect(Object.keys(result)).not.toContain('遊戲');
            expect(Object.keys(result)).toContain('音樂');
        });

        it('應處理 subMap 為 null 的情況', () => {
            const dataWithNull = { '遊戲': null, '音樂': { '唱歌': ['sing'] } };
            const result = filterAndSortAliases({
                data: dataWithNull, mode: 'nested', searchText: '', sortOption: 'name-asc',
            }) as Record<string, [string, string[]][]>;
            expect(Object.keys(result)).not.toContain('遊戲');
            expect(Object.keys(result)).toContain('音樂');
        });

        it('搜尋應在子分類名稱中匹配', () => {
            const result = filterAndSortAliases({
                data: nestedData, mode: 'nested', searchText: 'MC', sortOption: 'name-asc',
            }) as Record<string, [string, string[]][]>;
            expect(result['遊戲']).toHaveLength(1);
            expect(result['遊戲'][0][0]).toBe('MC');
        });

        it('搜尋應在子分類別名中匹配', () => {
            const result = filterAndSortAliases({
                data: nestedData, mode: 'nested', searchText: 'minecraft', sortOption: 'name-asc',
            }) as Record<string, [string, string[]][]>;
            expect(result['遊戲']).toHaveLength(1);
            expect(result['遊戲'][0][0]).toBe('MC');
        });

        it('排序應在每個主分類內獨立運作', () => {
            const result = filterAndSortAliases({
                data: nestedData, mode: 'nested', searchText: '', sortOption: 'alias-more',
            }) as Record<string, [string, string[]][]>;
            // 遊戲: MC(2 aliases) 應排在 LOL(1 alias) 前
            expect(result['遊戲'][0][0]).toBe('MC');
            expect(result['遊戲'][1][0]).toBe('LOL');
        });
    });
});
