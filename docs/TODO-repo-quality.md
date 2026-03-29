# Repo 品質改善待辦清單

> 目標：在履歷公開前，修正 repo review 指出的主要扣分項
> 建立日期：2026-03-30

---

## 1. 前端 TypeScript 嚴格型別修復

- **問題**：`tsconfig.json` 已開啟 `strict: true`，但 `tsc --noEmit` 有 411 個型別錯誤
- **影響**：宣稱嚴格型別與實際品質有落差，面試官一跑就會發現
- **錯誤分布**：
  - TS7031 (178)：解構參數缺型別標註
  - TS7006 (130)：函式參數缺型別標註
  - TS2339 (29)：存取不存在的屬性
  - TS7053 (24)：字串索引存取缺型別
  - 其他 (50)：型別不匹配、overload 等
- **主要檔案**（錯誤數前 10）：
  - `ChannelCategoryEditorPage.tsx` (21)
  - `SubcategoryCard.tsx` (18)
  - `TrendingChartBar.tsx` (15)
  - `ChartTypePie.tsx` (14)
  - `TrendingGameList.tsx` (13)
  - `LiveRedirectSection.tsx` (13)
  - `CategoryChartSection.tsx` (13)
  - `SlotVideoModal.tsx` (12)
  - `HeatmapContainer.tsx` (12)
  - `DonationList.tsx` (11)
- [x] 逐檔修復型別錯誤，確保 `tsc --noEmit` 零錯誤 ✅ 2026-03-30 完成（87 檔、411 errors → 0）

## 2. CI 補上前端 TypeScript 型別檢查

- **問題**：三個 CI workflow 都只有 ESLint + build，沒有 `tsc --noEmit`
- **影響**：型別錯誤無法被 CI 攔截，品質閘門不完整
- [ ] 在 `ci.yml` 的 `frontend-lint` job 加入 `npx tsc --noEmit`
- [ ] 在 `deploy-staging.yml` 的 `frontend-check` job 加入 `npx tsc --noEmit`
- [ ] 在 `deploy-production.yml` 的 `frontend-check` job 加入 `npx tsc --noEmit`

## 3. 後端模組層級環境變數讀取重構（低優先）

- **問題**：10 個檔案在 import 時讀取 `os.getenv()`，降低可測與可替換性
- **影響**：不是致命問題，但會被問到「為什麼不用 dependency injection」
- **涉及檔案**：
  - `services/google_oauth.py` — CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
  - `utils/jwt_util.py` — JWT_SECRET, ADMIN_CHANNEL_IDS
  - `utils/cloud_tasks_client.py` — PROJECT_ID, LOCATION, QUEUE_NAME, SERVICE_URL
  - `routes/websub_notify_route.py` — WEBSUB_SECRET
  - `utils/game_alias_fetcher.py` — ALIAS_API_URL
  - `services/channel_initializer.py` — ADMIN_CHANNEL_IDS, API_KEY
  - `services/ecpay_service.py` — MERCHANT_ID, HASH_KEY, HASH_IV
  - `services/firestore/index_service.py` — ADMIN_CHANNEL_IDS
  - `services/live_redirect/youtube_api.py` — API_KEY
  - `utils/rate_limiter.py` — RATE_LIMIT_STORAGE_URL
- [ ] 改為函式內讀取或透過 app config 注入（需同步調整測試）
