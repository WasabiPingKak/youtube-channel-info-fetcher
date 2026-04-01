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
# Pre-commit hooks（Ruff + pyright + ESLint + .env 保護）
pip install pre-commit           # 安裝 pre-commit framework
pre-commit install               # 啟用 git hook
pre-commit run --all-files       # 手動跑全部檢查

# Backend — Ruff
cd backend
ruff check . --config ruff.toml       # Lint
ruff check . --config ruff.toml --fix # Lint + 自動修正
ruff format . --config ruff.toml      # Format

# Backend — pyright（靜態型別檢查）
cd backend
pyright                          # 依 pyrightconfig.json 設定檢查

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
- **Infrastructure**: Google Cloud Run (backend), Firebase Hosting (frontend), Cloud Tasks (async job dispatch), Cloud Trace (distributed tracing via OpenTelemetry)

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
- **Route 自動註冊**: `utils/route_loader.py` 掃描 `routes/` 自動註冊，新增 route 只需建檔
- **OpenAPI**: APIFlask 自動產生 spec，`/docs` Swagger UI，`/openapi.json`
- **Frontend `@/` alias**: maps to `src/`
- **React Query**: 12-hour cache with localStorage
- **Dual environments**: staging / production，各自 `.env` + 獨立 Firestore 資料庫
- **Pydantic validation**: `@bp.input(Schema)` 驗證，422 由 `schemas/__init__.py` error_processor 處理
- **錯誤處理**: `utils/exceptions.py` exception hierarchy + `app.py` 全域 handler，路由層不需 try/except
- **Health check**: `/healthz` 檢查 Firestore + Cloud Tasks，任一失敗 503
- **Rate limiting**: `memory://` storage，多 Cloud Run instance 各自計算（全域需改 Redis）
- **OpenTelemetry**: `utils/otel_setup.py`，Cloud Run 自動啟用，本地跳過
- **Circuit Breaker**: `utils/circuit_breaker.py` + `utils/breaker_instances.py`，YouTube API 與 Firestore 各自獨立熔斷

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

`tools/migrate_prod_to_staging.py` — Production → Staging 資料複製（自動脫敏 OAuth token、禁止反向操作）：
```bash
cd backend
python tools/migrate_prod_to_staging.py --full --days 90          # 常用：保留 90 天
python tools/migrate_prod_to_staging.py --full --days 90 --dry-run # 預覽不寫入
```

### 備份策略

Production `(default)` 資料庫：Firestore 原生排程備份，每日一次，保留 7 天。還原只能到新資料庫。Staging 不備份（可從 Production 用 migrate 腳本重建）。

### Refresh Token 加密

OAuth refresh_token 使用 Google Cloud KMS 加密後存入 Firestore（`utils/kms_crypto.py`）：
- **KMS Key**: `vtmap-keyring/refresh-token-key`（asia-east1），環境變數 `KMS_KEY_RING` + `KMS_KEY_ID`
- 部署環境 KMS 未設定 → `kms_encrypt` raise，禁止明文。本地開發允許 fallback
- `kms_decrypt` 自動辨識未加密舊資料，不中斷服務
- 批次遷移：`tools/migrate_tokens_to_kms.py`（預設 dry-run，`--apply` 執行）

## Code Style
- **Language**: Use Traditional Chinese (繁體中文) for user-facing text and comments
- **Indent**: 4 spaces
- **Max line length**: 100 characters
- Explain modifications before making them when substantial changes are involved

## Git Conventions
- **Do not** include `Co-Authored-By` in commit messages
