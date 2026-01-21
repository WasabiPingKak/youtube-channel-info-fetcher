# PRD: Firestore Staging 環境分離設計

## 文件資訊
- **版本**: 1.0
- **建立日期**: 2026-01-21
- **狀態**: 待審核

## 1. 專案背景與問題陳述

### 1.1 現況問題
VTMap 專案目前的 Firestore 資料庫配置存在以下問題：

1. **無環境隔離**: Staging 和 Production 環境共用同一個 Firestore 資料庫 `(default)`
2. **資料風險**: Staging 測試可能意外修改或刪除 Production 資料
3. **測試限制**: 無法在 Staging 環境進行破壞性測試或資料結構變更測試
4. **除錯困難**: Staging 和 Production 的資料混雜，難以追蹤問題來源

### 1.2 現行架構
```
GCP Project: vtuber-channel-analyzer-v3
├── Cloud Run Services:
│   ├── youtube-api-service (Production)
│   └── youtube-api-staging-service (Staging)
├── Firestore Database:
│   └── (default) ← 兩個環境共用
└── Firebase Hosting:
    ├── vtuber-channel-analyzer-v3 (Production)
    └── vtuber-analyzer-staging (Staging)
```

## 2. 專案目標

### 2.1 主要目標
1. 建立獨立的 Staging Firestore 資料庫
2. 確保 Staging 和 Production 環境完全隔離
3. 提供 Production → Staging 資料遷移工具
4. 不影響現有 Production 環境運作

### 2.2 成功指標
- [ ] Staging 環境使用獨立的 Firestore 資料庫
- [ ] 能夠一鍵複製完整 Production 資料到 Staging
- [ ] 部署腳本自動選擇正確的資料庫
- [ ] 所有現有功能在新架構下正常運作

## 3. 技術方案設計

### 3.1 目標架構
```
GCP Project: vtuber-channel-analyzer-v3
├── Cloud Run Services:
│   ├── youtube-api-service (Production)
│   │   └── 環境變數: FIRESTORE_DATABASE=(default)
│   └── youtube-api-staging-service (Staging)
│       └── 環境變數: FIRESTORE_DATABASE=staging
├── Firestore Databases:
│   ├── (default) ← Production 專用
│   └── staging   ← Staging 專用
└── Firebase Hosting:
    ├── vtuber-channel-analyzer-v3 (Production)
    └── vtuber-analyzer-staging (Staging)
```

### 3.2 Firestore 資料庫配置

#### 3.2.1 建立 Staging 資料庫
- **資料庫名稱**: `staging`
- **位置**: 與 Production 相同 (asia-east1)
- **資料庫類型**: Firestore Native Mode
- **刪除保護**: 啟用

#### 3.2.2 Collection 結構
Staging 資料庫將複製 Production 的完整 Collection 結構：

**核心 Collections:**
1. `channel_data/{channelId}` - 頻道資料容器
   - Subcollections: `settings/config`, `settings/skip_keywords`, `videos_batch/*`, `channel_info/*`, `heat_map/*`
2. `channel_index_batch/batch_{N}` - 批次頻道索引（每批 1000 筆）
3. `channel_sync_index/index_list` - 影片同步追蹤
4. `trending_games_daily/{YYYY-MM-DD}` - 每日熱門遊戲分析
5. `live_redirect_cache/{YYYY-MM-DD}` - 直播快取（保留 3 天）
6. `live_redirect_notify_queue/{YYYY-MM-DD}` - WebSub 通知佇列
7. `stats_cache` - 統計快取（`active_time_weekly`, `active_time_pending`）
8. `global_settings` - 全域設定（`default_categories_config_v2`）
9. `donations_by_amount/{bucket}` - 贊助追蹤

**遺留 Collections (向後相容):**
- `channel_index/{channelId}` - 舊版頻道索引

### 3.3 程式碼修改設計

#### 3.3.1 Firestore 初始化邏輯更新

**檔案**: `backend/services/firebase_init_service.py`

**修改前:**
```python
def init_firestore():
    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-key.json")
    if not firebase_admin._apps:
        cred = credentials.Certificate(path)
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    return db
```

**修改後:**
```python
def init_firestore():
    """
    初始化 Firestore 客戶端，根據環境變數選擇資料庫

    環境變數:
        FIRESTORE_DATABASE: 資料庫名稱 (預設: "(default)")
        GOOGLE_APPLICATION_CREDENTIALS: 服務帳號金鑰路徑
    """
    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-key.json")
    database_id = os.getenv("FIRESTORE_DATABASE", "(default)")

    if not firebase_admin._apps:
        cred = credentials.Certificate(path)
        firebase_admin.initialize_app(cred)

    db = firestore.client(database=database_id)

    # 記錄使用的資料庫以便除錯
    print(f"[Firestore] Connected to database: {database_id}")

    return db
```

#### 3.3.2 統一所有 Firestore 客戶端實例化

**問題**: 目前許多服務檔案直接使用 `firestore.Client()` 實例化，繞過了統一的初始化邏輯。

**解決方案**: 建立全域 Firestore 客戶端單例

**新檔案**: `backend/services/firestore_client.py`
```python
"""
Firestore 客戶端單例
確保整個應用程式使用相同的 Firestore 資料庫連線
"""
from services.firebase_init_service import init_firestore

_db_instance = None

def get_firestore_client():
    """取得 Firestore 客戶端單例"""
    global _db_instance
    if _db_instance is None:
        _db_instance = init_firestore()
    return _db_instance
```

**需要修改的檔案** (約 20+ 個服務檔案):
- 所有含有 `from google.cloud import firestore` + `db = firestore.Client()` 的檔案
- 改用 `from services.firestore_client import get_firestore_client` + `db = get_firestore_client()`

#### 3.3.3 環境變數管理

**Backend 環境變數檔案結構:**
```
backend/
├── .env.example          # 範例檔案
├── .env.local            # 本地開發（Git ignored）
├── .env.staging          # Staging 環境變數 (新增)
└── .env.production       # Production 環境變數
```

**`.env.staging` 內容** (新增):
```bash
# Firestore Database
FIRESTORE_DATABASE=staging

# API URLs
FRONTEND_BASE_URL=https://vtuber-analyzer-staging.web.app
WEBSUB_CALLBACK_URL=https://youtube-api-staging-service-xxxxx-de.a.run.app/websub-callback

# OAuth
GOOGLE_REDIRECT_URI=https://vtuber-analyzer-staging.web.app/settings

# CORS
ALLOWED_ORIGINS=https://vtuber-analyzer-staging.web.app,http://localhost:5173

# Debug
OAUTH_DEBUG_MODE=true
```

**`.env.production` 更新** (新增資料庫設定):
```bash
# Firestore Database
FIRESTORE_DATABASE=(default)

# ... 其他現有設定
```

**`.env.example` 更新**:
```bash
# Firestore Database Configuration
FIRESTORE_DATABASE=(default)  # 或 "staging"

# ... 其他現有設定
```

### 3.4 部署腳本更新

#### 3.4.1 Backend 部署腳本

**檔案**: `backend/deploy_backend.sh`

**修改重點:**
1. Staging 部署時載入 `.env.staging`
2. 將 `FIRESTORE_DATABASE` 設定為 Cloud Run 環境變數
3. 確保環境變數正確傳遞到容器

**關鍵變更:**
```bash
# 根據環境載入對應的環境變數檔案
if [ "$ENVIRONMENT" == "production" ]; then
    if [ ! -f ".env.production" ]; then
        echo "錯誤: .env.production 檔案不存在"
        exit 1
    fi
    source .env.production
    echo "載入 Production 環境變數"
elif [ "$ENVIRONMENT" == "staging" ]; then
    if [ ! -f ".env.staging" ]; then
        echo "錯誤: .env.staging 檔案不存在"
        exit 1
    fi
    source .env.staging
    echo "載入 Staging 環境變數"
fi

# 部署到 Cloud Run 時加入 FIRESTORE_DATABASE 環境變數
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_URL \
    --region $REGION \
    --platform managed \
    --set-env-vars "FIRESTORE_DATABASE=${FIRESTORE_DATABASE}" \
    # ... 其他環境變數
```

#### 3.4.2 Frontend 部署腳本

**檔案**: `frontend_react/deploy_frontend.sh`

**修改**: 無需修改，Frontend 不直接存取 Firestore

### 3.5 資料遷移工具設計

#### 3.5.1 遷移腳本規格

**檔案**: `backend/tools/migrate_prod_to_staging.py`

**功能需求:**
1. 完整複製 Production `(default)` 資料庫到 Staging `staging` 資料庫
2. 支援增量更新（只複製變更的資料）
3. 支援指定 Collection 複製
4. 顯示進度與統計資訊
5. 安全檢查（防止反向複製 Staging → Production）
6. 複製敏感資料時的脫敏選項

**執行模式:**

```bash
# 完整複製（保留 90 天資料，預設會脫敏）
python tools/migrate_prod_to_staging.py --full --days 90

# 完整複製所有歷史資料
python tools/migrate_prod_to_staging.py --full --all-history

# 只複製指定 Collections
python tools/migrate_prod_to_staging.py --collections channel_data,channel_index_batch --days 90

# 增量更新（只複製有 updatedAt 欄位且時間較新的文件）
python tools/migrate_prod_to_staging.py --incremental --since "2026-01-20T00:00:00Z"

# 不脫敏模式（保留 OAuth tokens，僅用於特殊測試）
python tools/migrate_prod_to_staging.py --full --days 90 --no-sanitize

# 乾跑模式（只顯示會複製什麼，不實際執行）
python tools/migrate_prod_to_staging.py --full --days 90 --dry-run
```

**預設行為:**
- 自動脫敏（移除 OAuth tokens）
- 保留 90 天資料
- 完整複製時效性資料（`live_redirect_cache`, `trending_games_daily`）

**複製策略:**

1. **Document 層級複製:**
   - 使用 batch write 提升效能（每批最多 500 筆）
   - 保留原始 Timestamp 欄位值
   - 保留 Document ID

2. **Subcollection 遞迴複製:**
   - 自動偵測並複製所有 Subcollections
   - 例如: `channel_data/{id}/videos_batch/*` 的所有批次

3. **資料脫敏規則:**
   - 移除 `channel_info/meta` 中的 `refresh_token`
   - 移除 `channel_info/meta` 中的 `access_token`
   - 保留其他欄位以維持功能完整性

4. **效能優化:**
   - 平行處理（多執行緒複製不同 Collections）
   - 進度條顯示
   - 錯誤重試機制（3 次）

**輸出範例:**
```
======================================
Firestore Migration Tool
Production (default) → Staging (staging)
======================================

[1/9] Copying collection: channel_data
  ├─ Found 150 channels
  ├─ Processing subcollections for each channel...
  ├─ Progress: [████████████████████] 150/150 (100%)
  └─ Completed: 150 channels, 3,245 documents, 45.2s

[2/9] Copying collection: channel_index_batch
  ├─ Found 1 batches
  ├─ Progress: [████████████████████] 1/1 (100%)
  └─ Completed: 1 batch, 1 document, 0.5s

...

======================================
Migration Summary
======================================
Total Collections: 9
Total Documents: 12,547
Total Time: 3m 24s
Errors: 0
Status: ✓ Success
======================================
```

#### 3.5.2 安全檢查機制

**防止誤操作:**
```python
def validate_migration_direction():
    """
    確保只能從 Production → Staging 複製
    防止 Staging 資料覆蓋 Production
    """
    source_db = os.getenv("SOURCE_FIRESTORE_DATABASE", "(default)")
    target_db = os.getenv("TARGET_FIRESTORE_DATABASE", "staging")

    if source_db == "staging" and target_db == "(default)":
        raise ValueError(
            "❌ 禁止從 Staging 複製到 Production！\n"
            "這個操作會覆蓋正式環境資料，請檢查環境變數設定。"
        )

    if source_db == target_db:
        raise ValueError(
            f"❌ 來源和目標資料庫相同 ({source_db})！\n"
            "請檢查環境變數設定。"
        )

    print(f"✓ 複製方向驗證通過: {source_db} → {target_db}")
```

**互動式確認:**
```python
def confirm_migration():
    """要求使用者確認遷移操作"""
    print("\n⚠️  警告：此操作將覆蓋 Staging 資料庫的所有資料！")
    print(f"來源: {source_db}")
    print(f"目標: {target_db}")

    response = input("\n請輸入 'yes' 以確認繼續: ")
    if response.lower() != 'yes':
        print("❌ 操作已取消")
        sys.exit(0)
```

#### 3.5.3 Collection 優先順序

**複製順序**（確保相依性正確）:
1. `global_settings` - 全域設定（其他功能依賴此資料）
2. `channel_index_batch` - 頻道索引
3. `channel_data` - 頻道資料及所有 subcollections
4. `channel_sync_index` - 同步追蹤
5. `trending_games_daily` - 趨勢資料
6. `stats_cache` - 快取資料
7. `live_redirect_cache` - 直播快取
8. `live_redirect_notify_queue` - 通知佇列
9. `channel_index` - 遺留索引（最後複製，可選）

## 4. 實作計畫

### 4.1 Phase 1: 準備階段（預計 0.5 天）
- [ ] 在 Firebase Console 建立 `staging` 資料庫
- [ ] 建立 `.env.staging` 檔案
- [ ] 更新 `.env.production` 和 `.env.example`

### 4.2 Phase 2: 程式碼重構（預計 1 天）
- [ ] 實作 `firestore_client.py` 單例模式
- [ ] 更新 `firebase_init_service.py` 支援資料庫選擇
- [ ] 重構所有服務檔案使用統一的 Firestore 客戶端（約 20+ 檔案）
- [ ] 本地測試驗證

### 4.3 Phase 3: 遷移工具開發（預計 1.5 天）
- [ ] 實作 `migrate_prod_to_staging.py` 核心邏輯
- [ ] 實作安全檢查機制
- [ ] 實作資料脫敏功能
- [ ] 實作進度顯示與錯誤處理
- [ ] 撰寫單元測試

### 4.4 Phase 4: 部署腳本更新（預計 0.5 天）
- [ ] 更新 `deploy_backend.sh` 支援環境變數選擇
- [ ] 更新 Cloud Run 環境變數設定
- [ ] 測試部署流程

### 4.5 Phase 5: 測試與驗證（預計 1 天）
- [ ] 執行完整遷移測試（Production → Staging）
- [ ] 部署 Staging 環境驗證功能正常
- [ ] 測試所有 API endpoints
- [ ] 測試 Frontend 與 Staging Backend 整合
- [ ] 驗證資料隔離（Staging 操作不影響 Production）

### 4.6 Phase 6: 文件與上線（預計 0.5 天）
- [ ] 更新 CLAUDE.md 新增 Staging 資料庫說明
- [ ] 撰寫遷移工具使用文件
- [ ] 部署 Production 環境（確保使用 `(default)` 資料庫）
- [ ] 建立定期遷移排程（可選）

**總預計時間**: 5 天

## 5. 風險評估與緩解策略

### 5.1 技術風險

| 風險 | 影響 | 機率 | 緩解策略 |
|------|------|------|----------|
| Firestore 配額限制 | 中 | 低 | 使用 batch write，限制 QPS |
| 遷移時間過長 | 低 | 中 | 實作平行處理，在非尖峰時段執行 |
| Subcollection 遺漏 | 高 | 低 | 實作遞迴複製，驗證資料完整性 |
| 敏感資料外洩 | 高 | 低 | 強制執行脫敏模式，code review |
| 環境變數設定錯誤 | 高 | 中 | 實作安全檢查，部署前驗證 |

### 5.2 操作風險

| 風險 | 影響 | 機率 | 緩解策略 |
|------|------|------|----------|
| 誤刪 Production 資料 | 極高 | 極低 | 啟用刪除保護，互動式確認 |
| Staging → Production 反向複製 | 極高 | 低 | 硬編碼安全檢查，禁止反向操作 |
| 部署到錯誤環境 | 高 | 中 | 環境變數驗證，部署前確認提示 |

## 6. 測試計畫

### 6.1 單元測試
- [ ] `firebase_init_service.py` 資料庫選擇邏輯
- [ ] `firestore_client.py` 單例模式
- [ ] `migrate_prod_to_staging.py` 各項功能模組

### 6.2 整合測試
- [ ] Staging 環境完整 API 測試
- [ ] 資料遷移完整性驗證
- [ ] Frontend + Backend 整合測試

### 6.3 測試案例

**TC-001: 環境隔離驗證**
1. 在 Staging 建立測試頻道
2. 確認 Production 無此頻道
3. 刪除 Staging 測試頻道
4. 確認 Production 資料不受影響

**TC-002: 遷移工具完整性**
1. 執行 `--full` 遷移
2. 驗證所有 Collections 數量一致
3. 抽樣驗證 Document 內容一致
4. 驗證 Subcollections 完整複製

**TC-003: 資料脫敏驗證**
1. 執行 `--sanitize` 遷移
2. 驗證 Staging 無 `refresh_token`
3. 驗證 Staging 無 `access_token`
4. 驗證其他欄位完整

**TC-004: 安全檢查驗證**
1. 嘗試執行 Staging → Production 遷移
2. 確認被安全檢查阻擋
3. 驗證錯誤訊息清晰

## 7. 上線計畫

### 7.1 上線前檢查清單
- [ ] 所有程式碼變更已 review
- [ ] 單元測試 100% pass
- [ ] 整合測試 100% pass
- [ ] `.env.staging` 和 `.env.production` 已設定完成
- [ ] Firebase `staging` 資料庫已建立
- [ ] 遷移工具測試完成
- [ ] 文件已更新

### 7.2 上線步驟
1. 建立 Git feature branch
2. 提交所有變更
3. 執行 CI/CD pipeline (if any)
4. 部署 Staging 環境測試
5. 執行完整遷移
6. 驗證 Staging 功能
7. 部署 Production 環境（確保設定正確）
8. 驗證 Production 功能不受影響
9. 合併到主分支

### 7.3 Rollback 計畫
如需緊急回退：
1. 重新部署前一版本的 Cloud Run 服務
2. 環境變數會保留，無需額外設定
3. Firestore 資料不受影響（資料庫分離已完成）

## 8. 維運計畫

### 8.1 定期遷移
採用**手動執行**策略，在需要時執行 Production → Staging 遷移。

遷移命令會記錄在專案 README.md 中，方便隨時查閱。

### 8.2 監控指標
- Staging Firestore 資料庫大小（應與 Production 相近）
- 遷移工具執行時間趨勢
- Cloud Run 環境變數設定檢查

### 8.3 成本估算
- **Firestore Staging 資料庫**: 約等於 Production 儲存成本（假設相同資料量）
- **遷移操作成本**: 每次遷移約產生讀取操作（估計 10K-50K reads）
- **預估月增成本**: ~$5-20 USD（視資料量而定）

## 9. 開放問題與決策點

### 9.1 已確認的決策（2026-01-21）

1. ✅ **OAuth Tokens 脫敏**: **完全移除**
   - 決策: 選項 A - 完全移除 OAuth tokens
   - 理由: Staging 測試時會使用開發者自己的帳號登入授權，不需要保留 Production 的 tokens

2. ✅ **遷移頻率**: **手動執行**
   - 決策: 選項 B - 需要時手動遷移
   - 理由: 開發頻率較低，手動執行更具成本效益
   - 配套: 在 README.md 補充遷移腳本使用說明

3. ✅ **歷史資料保留**: **保留 90 天**
   - 決策: 自訂選項 - 保留最近 90 天的資料
   - 理由: 30 天資料量不足以進行完整測試，90 天提供更充足的測試資料
   - 實作: 遷移工具支援 `--days 90` 參數

4. ✅ **時效性資料處理**: **完整複製**
   - 決策: 複製所有時效性資料
   - 包含: `live_redirect_cache` (3天) 和 `trending_games_daily` (30天)
   - 理由: 確保 Staging 環境功能完整性

5. ✅ **Firestore 安全規則**: **使用相同規則**
   - 決策: 兩個資料庫使用相同的安全規則
   - 理由: Frontend 不直接存取 Firestore，所有操作透過 Backend API

### 9.2 技術選型確認
1. ✅ **資料庫位置**: 與 Production 相同（asia-east1）
2. ✅ **資料庫類型**: Firestore Native Mode
3. ✅ **遷移工具語言**: Python（與現有 backend 技術棧一致）

## 10. 附錄

### 10.1 相關檔案清單

**需要新增的檔案:**
- `backend/.env.staging`
- `backend/services/firestore_client.py`
- `backend/tools/migrate_prod_to_staging.py`
- `docs/PRD_Firestore_Staging_Environment.md` (本文件)

**需要修改的檔案:**
- `backend/services/firebase_init_service.py`
- `backend/deploy_backend.sh`
- `backend/.env.example`
- `backend/.env.production`
- `CLAUDE.md`
- 所有使用 `firestore.Client()` 的服務檔案（約 20+ 個）

### 10.2 參考文件
- [Firestore Multiple Databases](https://cloud.google.com/firestore/docs/database-references)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Firestore Best Practices](https://cloud.google.com/firestore/docs/best-practices)

---

## 審核與核准

- [x] 技術審核: 已完成 (2026-01-21)
- [x] 產品審核: 已完成 (2026-01-21)
- [x] 核准執行: 已核准 (2026-01-21)

**審核決議:**
```
所有決策點已確認：
- OAuth Tokens: 完全移除
- 遷移頻率: 手動執行
- 歷史資料: 保留 90 天
- 時效性資料: 完整複製

核准開始實作。
```
