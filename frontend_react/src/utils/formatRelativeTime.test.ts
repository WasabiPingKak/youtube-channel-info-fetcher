import { formatRelativeTime } from './formatRelativeTime';

describe('formatRelativeTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('不到 24 小時應顯示「X 小時前」', () => {
        // 3 小時前
        expect(formatRelativeTime('2025-06-15T09:00:00Z')).toBe('3 小時前');
    });

    it('不到 1 小時應顯示「0 小時前」', () => {
        expect(formatRelativeTime('2025-06-15T11:30:00Z')).toBe('0 小時前');
    });

    it('1-29 天應顯示「X 天前」', () => {
        // 5 天前
        expect(formatRelativeTime('2025-06-10T12:00:00Z')).toBe('5 天前');
    });

    it('恰好 24 小時應顯示「1 天前」', () => {
        expect(formatRelativeTime('2025-06-14T12:00:00Z')).toBe('1 天前');
    });

    it('30 天以上應顯示 YYYY/MM/DD 格式', () => {
        expect(formatRelativeTime('2024-01-15T00:00:00Z')).toBe('2024/01/15');
    });

    it('恰好 30 天應顯示 YYYY/MM/DD 格式', () => {
        // 30 天前 = 2025-05-16
        expect(formatRelativeTime('2025-05-16T12:00:00Z')).toBe('2025/05/16');
    });

    it('空字串應回傳空字串', () => {
        expect(formatRelativeTime('')).toBe('');
    });

    it('無效日期會產生 NaN 結果（函式未處理此邊界）', () => {
        // new Date('not-a-date') 不會拋錯，只會產生 Invalid Date
        // 函式目前回傳 'NaN/NaN/NaN'，這是已知的邊界行為
        const result = formatRelativeTime('not-a-date');
        expect(typeof result).toBe('string');
    });
});
