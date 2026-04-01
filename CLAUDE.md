# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VTMap (Vtuber TrailMap) is a YouTube channel analysis and live-streaming management tool for Vtuber creators. It categorizes videos by topic (雜談/遊戲/音樂/節目), provides analytics, and offers a live redirect helper for streamers.

**Live site**: https://www.vtubertrailmap.com/

## Development Commands

### Frontend (frontend_react/)
```bash
cd frontend_react
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run tests (Vitest)
npm run test:watch   # Run tests in watch mode
```

### Backend (backend/)
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
python app.py                      # Run APIFlask server locally
pytest                             # Run tests
pytest --cov                       # Run tests with coverage
```

### Linting & Formatting
```bash
# Pre-commit hooks（Ruff + ESLint + .env 保護）
pip install pre-commit           # 安裝 pre-commit framework
pre-commit install               # 啟用 git hook
pre-commit run --all-files       # 手動跑全部檢查

# Backend — Ruff
cd backend
ruff check . --config ruff.toml       # Lint
ruff check . --config ruff.toml --fix # Lint + 自動修正
ruff format . --config ruff.toml      # Format

# Frontend — ESLint
cd frontend_react
npm run lint                     # Lint src/
```

### Deployment (CI/CD)

部署由 GitHub Actions 自動執行，不需本地腳本：

- **Staging**: push 到 `develop` → `.github/workflows/deploy-staging.yml`
- **Production**: push 到 `main` → `.github/workflows/deploy-production.yml`

每個 workflow 包含品質閘門（lint + test）通過後才部署 Backend（Cloud Run）與 Frontend（Firebase Hosting）。

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS, Zustand (state), TanStack Query (data fetching), shadcn/ui components
- **Backend**: APIFlask + Python (Application Factory pattern), Google Cloud Firestore, YouTube Data API v3, Flask-Limiter (rate limiting), Pydantic (request validation), OpenAPI 3.1 (auto-generated via APIFlask)
- **Infrastructure**: Google Cloud Run (backend), Firebase Hosting (frontend), Cloud Tasks (async job dispatch)

### Project Structure
```
├── backend/
│   ├── app.py                 # APIFlask app entry point (create_app factory)
│   ├── schemas/               # Pydantic request/response schemas (common, video, settings, category_editor, admin)
│   ├── routes/                # API route modules (37 endpoints)
│   ├── services/              # Business logic layer
│   │   ├── youtube/           # YouTube API integration
│   │   ├── firestore/         # Database operations
│   │   ├── video_analyzer/    # Video classification by title keywords
│   │   ├── trending/          # Trending channel/game analytics
│   │   ├── live_redirect/     # Live stream caching and routing
│   │   └── heatmap/           # Active time visualization
│   └── utils/                 # Shared utilities
│
├── frontend_react/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Feature-grouped UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── stores/            # Zustand state stores
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   └── public/                # Static assets
```

### Key Patterns
- **Backend routes** are modular: each feature has its own `init_*_route(app, db)` function in `routes/`，使用 `APIBlueprint` 並帶有 `@bp.doc()` OpenAPI 標記。路由透過 `utils/route_loader.py` 自動掃描註冊，新增 route 只需建檔不用改 `app.py`
- **OpenAPI 文件**: APIFlask 自動產生 OpenAPI 3.1 spec，`/docs` 提供 Swagger UI，`/openapi.json` 提供 spec
- **Frontend uses `@/` alias** for imports (maps to `src/`)
- **React Query persistence**: 12-hour cache with localStorage
- **Dual environments**: staging and production with separate `.env` files and **separate Firestore databases**
- **Pydantic validation**: POST routes 透過 `@bp.input(Schema)` 驗證請求（APIFlask 原生整合），ValidationError 由 `schemas/__init__.py` 的 `error_processor` 統一回傳 422
- **錯誤處理**: `utils/exceptions.py` 定義自訂 exception hierarchy（`AppError` → `NotFoundError` 404 / `AuthorizationError` 403 / `ConfigurationError` 500 / `ExternalServiceError` 502）。`app.py` 的 `register_error_handlers()` 註冊全域 handler 統一處理 `AppError`、`GoogleAPIError`（Firestore）、`HttpError`（YouTube API），路由層不需重複 try/except。回應格式統一為 `{"error": "<message>"}` + 正確 HTTP 狀態碼。Callback 端點（ECPay、OAuth、WebSub）保留本地 error handling（回傳純文字）
- **Health check**: `/healthz` 端點檢查 Firestore 連線 + Cloud Tasks queue 可用性（`check_health()` 透過 GetQueue 驗證），回傳結構化 `checks` 物件，任一失敗即 503。`/` 僅回傳服務存活訊息
- **Rate limiting 已知限制**: Flask-Limiter 預設使用 `memory://` storage，在 Cloud Run 多 instance 環境下各 instance 各自計算，無法全域一致限制。若需全域限制需改用 Redis 作為 storage backend（設定 `RATE_LIMIT_STORAGE_URL` 環境變數）

### Data Flow
```
Frontend → Firebase Hosting → Cloud Run Backend → YouTube API / Firestore
                                              ↓
                              WebSub (push notifications for new videos)
```

### Firestore Database Architecture

專案使用雙資料庫環境隔離設計：

- **Production**: 使用 `(default)` 資料庫
- **Staging**: 使用 `staging` 資料庫

環境變數 `FIRESTORE_DATABASE` 控制連線的資料庫：
- `.env.production` 設定 `FIRESTORE_DATABASE=(default)`
- `.env.staging` 設定 `FIRESTORE_DATABASE=staging`

#### 資料庫遷移

使用 `migrate_prod_to_staging.py` 將 Production 資料複製到 Staging：

```bash
cd backend

# 完整複製（保留 90 天資料，自動脫敏）
python tools/migrate_prod_to_staging.py --full --days 90

# 複製所有歷史資料
python tools/migrate_prod_to_staging.py --full --all-history

# 只複製指定 Collections
python tools/migrate_prod_to_staging.py --collections channel_data,channel_index_batch --days 90

# Dry Run 模式（不實際寫入）
python tools/migrate_prod_to_staging.py --full --days 90 --dry-run
```

**安全機制**：
- 自動脫敏：移除 OAuth refresh_token 和 access_token
- 安全檢查：禁止從 Staging 複製到 Production
- 互動確認：執行前需輸入 'yes' 確認

### Refresh Token 加密

OAuth refresh_token 使用 Google Cloud KMS 加密後存入 Firestore（`utils/kms_crypto.py`）：
- **KMS Key**: `vtmap-keyring/refresh-token-key`（asia-east1）
- **環境變數**: `KMS_KEY_RING`、`KMS_KEY_ID`（已設定於 Cloud Run prod + staging）
- **安全防護**: 部署環境（production / staging）KMS 未設定時 `kms_encrypt` 直接 raise、`create_app()` 啟動失敗，禁止明文 fallback。本地開發允許 fallback 明文
- **讀取相容**: `kms_decrypt` 仍自動辨識未加密的舊資料，不中斷服務
- **批次加密遷移**: `tools/migrate_tokens_to_kms.py` 可掃描並加密所有明文 token（預設 dry-run，需 `--apply` 才執行；`--audit` 僅掃描回報未加密數量）

## Code Style
- **Language**: Use Traditional Chinese (繁體中文) for user-facing text and comments
- **Indent**: 4 spaces
- **Max line length**: 100 characters
- Explain modifications before making them when substantial changes are involved

## Git Conventions
- **Do not** include `Co-Authored-By` in commit messages
