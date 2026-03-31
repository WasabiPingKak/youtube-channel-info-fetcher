# TODO — Review 回饋待處理項目

> 來源：Gemini / GPT / Claude 三份後端面試視角 Review（2026-03-31）
> 僅列可 actionable 的項目，架構討論性質的觀察不列入

---

## P1 — 高優先（API 品質 & 一致性）

（全部完成，已移至 Done）

---

## P2 — 中優先（測試 & 前端品質）

（全部完成，已移至 Done）

---

## Done（已處理）

- [x] GET 端點參數改用 Schema 驗證 → 8 個路由改用 `@bp.input(Schema, location="query")`，排除 OAuth/WebSub
- [x] 成功回應格式統一 → 7 個路由補齊 `"success": true`，排除 service 直接回傳的 dict
- [x] conftest.py 測試基礎設施 → 提取 `create_test_app()` helper，11 個測試檔移除重複 boilerplate
- [x] 前端 request layer 統一 → 新增 `lib/api.ts` 共用 API client，24 個檔案移除重複 API_BASE 宣告
- [x] require_auth 每次查 Firestore → TTLCache(256, 60s) 快取
- [x] Cloud Tasks 批次串行 → ThreadPoolExecutor(max_workers=10) 並行
- [x] Fat Routes 業務邏輯抽離 → 已移至 service 層
- [x] 前端 TypeScript `any` 濫用 → 已清除
- [x] Firestore 單 doc 接近 1MB → 2000 筆/doc 分批策略可控
