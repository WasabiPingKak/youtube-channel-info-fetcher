const { mockApiPost } = vi.hoisted(() => ({
    mockApiPost: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    apiPost: (...args: unknown[]) => mockApiPost(...args),
    API_BASE: '',
}));

import { loadChannelSettings, saveChannelSettings } from './firestore';

// ===== Helper: 建立 mock Response =====

function mockResponse(options: {
    ok?: boolean;
    status?: number;
    json?: unknown;
    jsonError?: boolean;
    text?: string;
}): Response {
    const { ok = true, status = 200, json, jsonError = false, text = '' } = options;
    return {
        ok,
        status,
        json: jsonError
            ? () => Promise.reject(new Error('JSON parse error'))
            : () => Promise.resolve(json),
        text: () => Promise.resolve(text),
    } as unknown as Response;
}

// ===== loadChannelSettings =====

describe('loadChannelSettings', () => {
    beforeEach(() => {
        mockApiPost.mockReset();
    });

    it('成功時應回傳 { success: true, settings }', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ json: { settings: { cat: 'data' } } })
        );

        const result = await loadChannelSettings('UC123');
        expect(result).toEqual({
            success: true,
            settings: { cat: 'data' },
            error: null,
            code: null,
        });
    });

    it('settings 為空時應回傳 null', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ json: { settings: null } })
        );

        const result = await loadChannelSettings('UC123');
        expect(result.success).toBe(true);
        expect(result.settings).toBeNull();
    });

    it('404 時應回傳 { success: false, code: "not-found" }', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ ok: false, status: 404 })
        );

        const result = await loadChannelSettings('UC123');
        expect(result.success).toBe(false);
        expect(result.code).toBe('not-found');
    });

    it('其他 HTTP 錯誤應回傳 { success: false, code: "HTTP_ERROR" }', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ ok: false, status: 500 })
        );

        const result = await loadChannelSettings('UC123');
        expect(result.success).toBe(false);
        expect(result.code).toBe('HTTP_ERROR');
    });

    it('fetch 失敗（network error）應回傳 { success: false, code: "FETCH_ERROR" }', async () => {
        mockApiPost.mockRejectedValueOnce(new Error('Network error'));

        const result = await loadChannelSettings('UC123');
        expect(result.success).toBe(false);
        expect(result.code).toBe('FETCH_ERROR');
        expect(result.error).toBe('Network error');
    });

    it('應呼叫正確的 API 路徑與 body', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ json: { settings: {} } })
        );

        await loadChannelSettings('UC_TEST');

        expect(mockApiPost).toHaveBeenCalledWith(
            '/api/firestore/load-category-settings',
            { channel_id: 'UC_TEST' },
        );
    });
});

// ===== saveChannelSettings =====

describe('saveChannelSettings', () => {
    beforeEach(() => {
        mockApiPost.mockReset();
    });

    it('成功時應回傳 { success: true, updated_count }', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ json: { updated_count: 5 } })
        );

        const result = await saveChannelSettings('UC123', { key: 'val' });
        expect(result).toEqual({ success: true, updated_count: 5 });
    });

    it('HTTP 錯誤且有 error body 時應回傳其 error 訊息', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ ok: false, status: 400, json: { error: '資料格式錯誤' } })
        );

        const result = await saveChannelSettings('UC123', {});
        expect(result.success).toBe(false);
        expect(result.error).toBe('資料格式錯誤');
    });

    it('HTTP 錯誤且無法解析 body 時應回傳 HTTP 狀態碼錯誤', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ ok: false, status: 500, jsonError: true })
        );

        const result = await saveChannelSettings('UC123', {});
        expect(result.success).toBe(false);
        expect(result.error).toContain('500');
    });

    it('回傳 body 中包含 error 欄位時應視為失敗', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ json: { error: '伺服器內部錯誤' } })
        );

        const result = await saveChannelSettings('UC123', {});
        expect(result.success).toBe(false);
        expect(result.error).toBe('伺服器內部錯誤');
    });

    it('fetch 失敗（network error）應回傳 { success: false, error }', async () => {
        mockApiPost.mockRejectedValueOnce(new Error('Connection refused'));

        const result = await saveChannelSettings('UC123', {});
        expect(result.success).toBe(false);
        expect(result.error).toBe('Connection refused');
    });

    it('應呼叫正確的 API 路徑與 body', async () => {
        mockApiPost.mockResolvedValueOnce(
            mockResponse({ json: { updated_count: 1 } })
        );

        const settings = { cat: { sub: ['alias'] } };
        await saveChannelSettings('UC_TEST', settings);

        expect(mockApiPost).toHaveBeenCalledWith(
            '/api/categories/save-and-apply',
            { channel_id: 'UC_TEST', settings },
        );
    });
});
