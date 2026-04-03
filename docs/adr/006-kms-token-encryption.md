# ADR-006：Google Cloud KMS 加密 Refresh Token

## 狀態

已採用

## 背景

VTMap 允許創作者透過 OAuth 授權存取其 YouTube 頻道資料，授權後取得的 refresh token 需儲存於 Firestore 以供後續 API 呼叫。Refresh token 是高敏感憑證，若 Firestore 資料外洩，攻擊者可冒用創作者身份操作 YouTube API。

## 決策

使用 **Google Cloud KMS** 對 refresh token 加密後再存入 Firestore。

### 加密流程

```
refresh_token (明文)
  → KMS encrypt API
  → base64 encode
  → 存入 Firestore (密文)
```

### 解密流程

```
Firestore 讀取 (密文)
  → base64 decode
  → KMS decrypt API
  → refresh_token (明文)
```

### KMS Key 設定

- **Key Ring**：`vtmap-keyring`（asia-east1）
- **Key**：`refresh-token-key`
- 環境變數：`KMS_KEY_RING`、`KMS_KEY_ID`、`KMS_LOCATION`（預設 asia-east1）、`GOOGLE_CLOUD_PROJECT`

### 環境差異行為

| 環境 | KMS 設定 | 行為 |
|------|---------|------|
| Production / Staging | 必須設定 | 加密存儲，啟動時 guardrail 檢查 |
| 本地開發 | 可不設定 | `kms_encrypt` 回傳明文 + warning log |
| 測試 | 不設定 | mock 或 bypass |

### 向後相容

`kms_decrypt` 自動辨識未加密的舊資料：

1. 嘗試 base64 decode → 失敗則視為明文直接回傳
2. KMS decrypt 失敗 → 視為未加密舊資料，log warning 並回傳原文
3. 批次遷移腳本：`tools/migrate_tokens_to_kms.py`（預設 dry-run，`--apply` 執行）

### 啟動檢查

`app.py` 在部署環境啟動時驗證 KMS 設定，未設定直接 raise 阻止服務啟動，杜絕明文儲存。

## 評估過的替代方案

| 方案 | 優點 | 缺點 |
|------|------|------|
| Firestore field-level encryption（自行 AES） | 不依賴 GCP 服務 | 金鑰管理問題轉嫁自己；key rotation 需自行實作 |
| Google Secret Manager | 專為 secret 設計 | 每個 token 一個 secret，管理成本高；不適合動態新增的使用者 token |
| 不加密 | 最簡單 | Firestore 資料外洩 = token 外洩 |

## 影響

- **正面**：Key rotation 由 KMS 管理；Firestore 資料外洩時 token 仍受保護
- **負面**：每次讀寫 token 增加一次 KMS API 呼叫（延遲約 10-50ms）
- **關鍵檔案**：`backend/utils/kms_crypto.py`、`backend/tools/migrate_tokens_to_kms.py`
