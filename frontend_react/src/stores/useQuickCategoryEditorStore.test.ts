import type { SuggestedKeywordCardState } from '@/utils/keywordCardBuilder';

// ===== Mock 設定（使用 vi.hoisted 避免 hoisting 問題） =====

const { mockApplyQuickCategory, mockApiPost } = vi.hoisted(() => ({
    mockApplyQuickCategory: vi.fn(),
    mockApiPost: vi.fn(),
}));

vi.mock('@/hooks/useQuickCategoryApply', () => ({
    useQuickCategoryApply: () => mockApplyQuickCategory,
}));

vi.mock('@/lib/api', () => ({
    apiPost: (...args: unknown[]) => mockApiPost(...args),
    API_BASE: '',
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

// mock alert（applyAgree 中使用）
vi.stubGlobal('alert', vi.fn());

import { useQuickCategoryEditorStore } from './useQuickCategoryEditorStore';

// ===== 測試資料 =====

const makeCard = (overrides: Partial<SuggestedKeywordCardState> = {}): SuggestedKeywordCardState => ({
    keyword: 'minecraft',
    count: 5,
    agreed: false,
    skipped: false,
    subcategoryName: 'Minecraft',
    mainCategories: ['遊戲'],
    matchedVideos: [],
    ...overrides,
});

const resetStore = () => {
    useQuickCategoryEditorStore.setState({ cards: [], channelId: '' });
};

// ===== 測試 =====

describe('useQuickCategoryEditorStore', () => {
    beforeEach(() => {
        resetStore();
        vi.clearAllMocks();
    });

    // ----- initializeCards -----

    describe('initializeCards', () => {
        it('應設定 cards 並將每張卡片的 isSaving 初始化為 false', () => {
            const cards = [makeCard({ isSaving: true }), makeCard({ keyword: 'singing' })];
            useQuickCategoryEditorStore.getState().initializeCards(cards);

            const state = useQuickCategoryEditorStore.getState();
            expect(state.cards).toHaveLength(2);
            expect(state.cards[0].isSaving).toBe(false);
            expect(state.cards[1].isSaving).toBe(false);
        });
    });

    // ----- setChannelId -----

    describe('setChannelId', () => {
        it('應設定 channelId', () => {
            useQuickCategoryEditorStore.getState().setChannelId('UC123');
            expect(useQuickCategoryEditorStore.getState().channelId).toBe('UC123');
        });
    });

    // ----- toggleAgree -----

    describe('toggleAgree', () => {
        it('應切換指定卡片的 agreed 狀態', () => {
            useQuickCategoryEditorStore.getState().initializeCards([makeCard()]);

            useQuickCategoryEditorStore.getState().toggleAgree('minecraft');
            expect(useQuickCategoryEditorStore.getState().cards[0].agreed).toBe(true);

            useQuickCategoryEditorStore.getState().toggleAgree('minecraft');
            expect(useQuickCategoryEditorStore.getState().cards[0].agreed).toBe(false);
        });

        it('agreed 時應清除 skipped', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ skipped: true }),
            ]);

            useQuickCategoryEditorStore.getState().toggleAgree('minecraft');
            const card = useQuickCategoryEditorStore.getState().cards[0];
            expect(card.agreed).toBe(true);
            expect(card.skipped).toBe(false);
        });

        it('不應影響其他卡片', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard(),
                makeCard({ keyword: 'singing', agreed: true }),
            ]);

            useQuickCategoryEditorStore.getState().toggleAgree('minecraft');
            expect(useQuickCategoryEditorStore.getState().cards[1].agreed).toBe(true);
        });
    });

    // ----- toggleSkip -----

    describe('toggleSkip', () => {
        it('應切換指定卡片的 skipped 狀態', () => {
            useQuickCategoryEditorStore.getState().initializeCards([makeCard()]);

            useQuickCategoryEditorStore.getState().toggleSkip('minecraft');
            expect(useQuickCategoryEditorStore.getState().cards[0].skipped).toBe(true);
        });

        it('skipped 時應清除 agreed, isSaving, isSuccess', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true, isSaving: true, isSuccess: true }),
            ]);

            useQuickCategoryEditorStore.getState().toggleSkip('minecraft');
            const card = useQuickCategoryEditorStore.getState().cards[0];
            expect(card.skipped).toBe(true);
            expect(card.agreed).toBe(false);
            expect(card.isSaving).toBe(false);
            expect(card.isSuccess).toBe(false);
        });
    });

    // ----- setSubcategoryName -----

    describe('setSubcategoryName', () => {
        it('應設定子分類名稱（自動 trim）', () => {
            useQuickCategoryEditorStore.getState().initializeCards([makeCard()]);

            useQuickCategoryEditorStore.getState().setSubcategoryName('minecraft', '  MC  ');
            expect(useQuickCategoryEditorStore.getState().cards[0].subcategoryName).toBe('MC');
        });

        it('空白名稱應 fallback 為 keyword', () => {
            useQuickCategoryEditorStore.getState().initializeCards([makeCard()]);

            useQuickCategoryEditorStore.getState().setSubcategoryName('minecraft', '');
            expect(useQuickCategoryEditorStore.getState().cards[0].subcategoryName).toBe('minecraft');
        });

        it('純空格名稱應 fallback 為 keyword', () => {
            useQuickCategoryEditorStore.getState().initializeCards([makeCard()]);

            useQuickCategoryEditorStore.getState().setSubcategoryName('minecraft', '   ');
            expect(useQuickCategoryEditorStore.getState().cards[0].subcategoryName).toBe('minecraft');
        });
    });

    // ----- toggleMainCategory -----

    describe('toggleMainCategory', () => {
        it('應新增主分類', () => {
            useQuickCategoryEditorStore.getState().initializeCards([makeCard({ mainCategories: [] })]);

            useQuickCategoryEditorStore.getState().toggleMainCategory('minecraft', '遊戲');
            expect(useQuickCategoryEditorStore.getState().cards[0].mainCategories).toEqual(['遊戲']);
        });

        it('已存在的主分類應移除（toggle off）', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ mainCategories: ['遊戲', '雜談'] }),
            ]);

            useQuickCategoryEditorStore.getState().toggleMainCategory('minecraft', '遊戲');
            expect(useQuickCategoryEditorStore.getState().cards[0].mainCategories).toEqual(['雜談']);
        });
    });

    // ----- getAgreedCount -----

    describe('getAgreedCount', () => {
        it('應回傳 agreed 為 true 的卡片數量', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true }),
                makeCard({ keyword: 'singing', agreed: false }),
                makeCard({ keyword: 'zelda', agreed: true }),
            ]);

            expect(useQuickCategoryEditorStore.getState().getAgreedCount()).toBe(2);
        });
    });

    // ----- getSavePayload -----

    describe('getSavePayload', () => {
        it('應建立 { mainCategory: { subcategoryName: [keyword] } } 結構', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true, mainCategories: ['遊戲'], subcategoryName: 'Minecraft', keyword: 'mc' }),
            ]);

            const payload = useQuickCategoryEditorStore.getState().getSavePayload();
            expect(payload).toEqual({ '遊戲': { 'Minecraft': ['mc'] } });
        });

        it('未 agreed 的卡片不應出現在 payload', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: false, mainCategories: ['遊戲'] }),
            ]);

            const payload = useQuickCategoryEditorStore.getState().getSavePayload();
            expect(payload).toEqual({});
        });

        it('mainCategories 為空的卡片不應出現在 payload', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true, mainCategories: [] }),
            ]);

            const payload = useQuickCategoryEditorStore.getState().getSavePayload();
            expect(payload).toEqual({});
        });

        it('subcategoryName 與 keyword 相同時，aliases 陣列應為空', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true, mainCategories: ['遊戲'], subcategoryName: 'minecraft', keyword: 'minecraft' }),
            ]);

            const payload = useQuickCategoryEditorStore.getState().getSavePayload();
            expect(payload).toEqual({ '遊戲': { 'minecraft': [] } });
        });

        it('多張卡片歸屬同一 mainCategory 時應合併', () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true, keyword: 'mc', subcategoryName: 'Minecraft', mainCategories: ['遊戲'] }),
                makeCard({ agreed: true, keyword: 'val', subcategoryName: 'Valorant', mainCategories: ['遊戲'] }),
            ]);

            const payload = useQuickCategoryEditorStore.getState().getSavePayload();
            expect(payload['遊戲']).toHaveProperty('Minecraft');
            expect(payload['遊戲']).toHaveProperty('Valorant');
        });
    });

    // ----- applyAgree (async) -----

    describe('applyAgree', () => {
        it('mainCategories 為空時應 alert 而不呼叫 API', async () => {
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ mainCategories: [] }),
            ]);

            await useQuickCategoryEditorStore.getState().applyAgree('minecraft');
            expect(alert).toHaveBeenCalled();
            expect(mockApplyQuickCategory).not.toHaveBeenCalled();
        });

        it('成功時應設定 agreed:true, isSaving:false, isSuccess:true', async () => {
            mockApplyQuickCategory.mockResolvedValueOnce({ success: true });
            useQuickCategoryEditorStore.getState().initializeCards([makeCard()]);
            useQuickCategoryEditorStore.getState().setChannelId('UC123');

            await useQuickCategoryEditorStore.getState().applyAgree('minecraft');

            const card = useQuickCategoryEditorStore.getState().cards[0];
            expect(card.agreed).toBe(true);
            expect(card.isSaving).toBe(false);
            expect(card.isSuccess).toBe(true);
        });

        it('失敗時應還原為之前的 cards 狀態', async () => {
            mockApplyQuickCategory.mockRejectedValueOnce(new Error('API error'));
            const initialCards = [makeCard({ agreed: false })];
            useQuickCategoryEditorStore.getState().initializeCards(initialCards);

            await useQuickCategoryEditorStore.getState().applyAgree('minecraft');

            const card = useQuickCategoryEditorStore.getState().cards[0];
            expect(card.agreed).toBe(false);
            expect(card.isSaving).toBe(false);
        });
    });

    // ----- removeAppliedKeyword (async) -----

    describe('removeAppliedKeyword', () => {
        it('成功時應設定 agreed:false, isSuccess:false', async () => {
            mockApiPost.mockResolvedValueOnce({ ok: true, text: vi.fn() });
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true, isSuccess: true }),
            ]);
            useQuickCategoryEditorStore.getState().setChannelId('UC123');

            await useQuickCategoryEditorStore.getState().removeAppliedKeyword('minecraft');

            const card = useQuickCategoryEditorStore.getState().cards[0];
            expect(card.agreed).toBe(false);
            expect(card.isSuccess).toBe(false);
            expect(card.isSaving).toBe(false);
        });

        it('失敗時應還原為之前的 cards 狀態', async () => {
            mockApiPost.mockRejectedValueOnce(new Error('network error'));
            useQuickCategoryEditorStore.getState().initializeCards([
                makeCard({ agreed: true, isSuccess: true }),
            ]);

            await useQuickCategoryEditorStore.getState().removeAppliedKeyword('minecraft');

            const card = useQuickCategoryEditorStore.getState().cards[0];
            expect(card.agreed).toBe(true);
            expect(card.isSuccess).toBe(true);
        });
    });

    // ----- setKeywordSkipped (async) -----

    describe('setKeywordSkipped', () => {
        it('skipped=true 時應 POST 到 skip-keyword/add', async () => {
            mockApiPost.mockResolvedValueOnce({ ok: true, text: vi.fn() });
            useQuickCategoryEditorStore.getState().initializeCards([makeCard()]);
            useQuickCategoryEditorStore.getState().setChannelId('UC123');

            await useQuickCategoryEditorStore.getState().setKeywordSkipped('minecraft', true);

            expect(mockApiPost).toHaveBeenCalledWith(
                '/api/quick-editor/skip-keyword/add',
                { channelId: 'UC123', keyword: 'minecraft' },
            );
        });

        it('skipped=false 時應 POST 到 skip-keyword/remove', async () => {
            mockApiPost.mockResolvedValueOnce({ ok: true, text: vi.fn() });
            useQuickCategoryEditorStore.getState().initializeCards([makeCard({ skipped: true })]);
            useQuickCategoryEditorStore.getState().setChannelId('UC123');

            await useQuickCategoryEditorStore.getState().setKeywordSkipped('minecraft', false);

            expect(mockApiPost).toHaveBeenCalledWith(
                '/api/quick-editor/skip-keyword/remove',
                { channelId: 'UC123', keyword: 'minecraft' },
            );
        });

        it('失敗時應還原狀態', async () => {
            mockApiPost.mockRejectedValueOnce(new Error('network error'));
            useQuickCategoryEditorStore.getState().initializeCards([makeCard({ skipped: false })]);

            await useQuickCategoryEditorStore.getState().setKeywordSkipped('minecraft', true);

            // 失敗後應還原為 skipped: false
            const card = useQuickCategoryEditorStore.getState().cards[0];
            expect(card.skipped).toBe(false);
        });
    });
});
