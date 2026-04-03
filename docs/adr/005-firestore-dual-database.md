# ADR-005：Firestore 雙資料庫環境隔離

## 狀態

已採用

## 背景

VTMap 需要 staging 環境用於測試新功能，但 staging 與 production 必須完全隔離資料，避免：

- 測試資料污染 production
- staging 部署意外讀寫 production 資料
- 開發者在本地誤連 production

Firestore 同一 GCP 專案支援多個 named database，可在不建立額外 GCP 專案的前提下隔離資料。

## 決策

在同一 GCP 專案中使用 **兩個 Firestore 資料庫**，透過環境變數 `FIRESTORE_DATABASE` 切換：

| 環境 | FIRESTORE_DATABASE | 說明 |
|------|-------------------|------|
| Production | `(default)` | 正式資料庫 |
| Staging | `staging` | 測試資料庫 |
| 本地開發 | 未設定（預設 `(default)`） | 通常搭配 emulator |

### 實作方式

`services/firebase_init_service.py` 根據環境變數初始化 Firestore client：

```python
database_id = os.getenv("FIRESTORE_DATABASE", "(default)")
db = firestore.client(database_id=database_id)
```

### 認證策略

- **Cloud Run**：Application Default Credentials（ADC），無需 key file
- **本地開發**：fallback 到 `firebase-key.json` 或 `GOOGLE_APPLICATION_CREDENTIALS` 環境變數
- **CI 測試**：Firestore emulator，使用 `AnonymousCredentials`

### 環境偵測的附帶用途

`FIRESTORE_DATABASE` 也被用於其他環境判斷：

- `app.py`：Swagger UI 僅在 `staging` 時啟用
- `kms_crypto.py`：`_is_deployed_env()` 判斷是否為部署環境，強制要求 KMS 設定

### 備份策略

- Production `(default)`：Firestore 原生排程備份，每日一次，保留 7 天
- Staging：不備份，可從 Production 用 `tools/migrate_prod_to_staging.py` 重建

## 評估過的替代方案

| 方案 | 優點 | 缺點 |
|------|------|------|
| 獨立 GCP 專案 | 完全隔離（IAM、billing） | 管理成本高，需維護兩份 CI/CD 設定 |
| 同資料庫 + collection prefix | 不需額外資料庫 | 查詢需帶 prefix，容易出錯；無法利用 Firestore security rules 隔離 |
| Firebase Emulator 當 staging | 無成本 | 無法模擬真實 quota 和延遲；資料不持久 |

## 影響

- **正面**：同一 GCP 專案管理，CI/CD 設定差異最小化；`migrate_prod_to_staging.py` 可快速重建 staging 資料（自動脫敏 OAuth token）
- **負面**：`FIRESTORE_DATABASE` 設錯會連到錯誤環境（緩解：CI/CD workflow 明確設定）
- **關鍵檔案**：`backend/services/firebase_init_service.py`、`backend/app.py`
- **延伸文件**：`docs/PRD_Firestore_Staging_Environment.md`
