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
```

### Backend (backend/)
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
python app.py                      # Run Flask server locally
pytest                             # Run tests
pytest --cov                       # Run tests with coverage
```

### Deployment
```bash
# Backend (Google Cloud Run)
cd backend
./deploy_backend.sh --staging      # Deploy to staging
./deploy_backend.sh --prod         # Deploy to production
./cleanup_old_revisions.sh --prod  # Clean old Cloud Run revisions (keeps 10)

# Frontend (Firebase Hosting)
cd frontend_react
./deploy_frontend.sh --staging     # Deploy to staging
./deploy_frontend.sh --prod        # Deploy to production
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS, Zustand (state), TanStack Query (data fetching), shadcn/ui components
- **Backend**: Flask + Python, Google Cloud Firestore, YouTube Data API v3
- **Infrastructure**: Google Cloud Run (backend), Firebase Hosting (frontend)

### Project Structure
```
├── backend/
│   ├── app.py                 # Flask app entry point
│   ├── routes/                # API route modules (25+ endpoints)
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
- **Backend routes** are modular: each feature has its own `init_*_route(app, db)` function in `routes/`
- **Frontend uses `@/` alias** for imports (maps to `src/`)
- **React Query persistence**: 12-hour cache with localStorage
- **Dual environments**: staging and production with separate `.env` files and **separate Firestore databases**

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

## Code Style
- **Language**: Use Traditional Chinese (繁體中文) for user-facing text and comments
- **Indent**: 4 spaces
- **Max line length**: 100 characters
- Explain modifications before making them when substantial changes are involved

## Git Conventions
- **Do not** include `Co-Authored-By` in commit messages
