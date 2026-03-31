const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { apiFetch, apiPost, API_BASE } from './api';

describe('API_BASE', () => {
    it('應為字串', () => {
        expect(typeof API_BASE).toBe('string');
    });
});

describe('apiFetch', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        mockFetch.mockResolvedValue(new Response('ok'));
    });

    it('應在 path 前加上 API_BASE', async () => {
        await apiFetch('/api/test');
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url] = mockFetch.mock.calls[0];
        expect(url).toBe(`${API_BASE}/api/test`);
    });

    it('應預設帶 credentials: "include"', async () => {
        await apiFetch('/api/test');
        const [, init] = mockFetch.mock.calls[0];
        expect(init.credentials).toBe('include');
    });

    it('應允許覆寫 init 參數', async () => {
        await apiFetch('/api/test', { headers: { 'X-Custom': 'yes' } });
        const [, init] = mockFetch.mock.calls[0];
        expect(init.headers).toEqual({ 'X-Custom': 'yes' });
    });

    it('應回傳 fetch 的 Response', async () => {
        const expected = new Response('hello');
        mockFetch.mockResolvedValueOnce(expected);
        const result = await apiFetch('/api/test');
        expect(result).toBe(expected);
    });
});

describe('apiPost', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        mockFetch.mockResolvedValue(new Response('ok'));
    });

    it('應使用 POST 方法', async () => {
        await apiPost('/api/test', { key: 'value' });
        const [, init] = mockFetch.mock.calls[0];
        expect(init.method).toBe('POST');
    });

    it('應設定 Content-Type: application/json', async () => {
        await apiPost('/api/test', { key: 'value' });
        const [, init] = mockFetch.mock.calls[0];
        expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('應將 body 序列化為 JSON', async () => {
        const data = { key: 'value', nested: { a: 1 } };
        await apiPost('/api/test', data);
        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify(data));
    });

    it('應帶 credentials: "include"', async () => {
        await apiPost('/api/test', {});
        const [, init] = mockFetch.mock.calls[0];
        expect(init.credentials).toBe('include');
    });

    it('額外的 init 參數應能覆寫預設值', async () => {
        await apiPost('/api/test', {}, { method: 'PUT' });
        const [, init] = mockFetch.mock.calls[0];
        // spread 順序: { method: 'POST', headers, body, ...init } → init 的 method 覆蓋
        expect(init.method).toBe('PUT');
    });
});
