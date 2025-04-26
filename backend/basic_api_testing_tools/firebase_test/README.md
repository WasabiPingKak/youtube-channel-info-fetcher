# Firebase 測試工具

這是一個用於測試 Firebase/Firestore 連接的簡單工具，主要用於驗證 Firebase 服務的可用性和權限設定。

## 功能特點

- 提供基本的 Firebase 初始化測試
- 包含 Firestore 寫入測試端點
- 支援延遲測試功能
- 完整的錯誤處理和日誌記錄
- 支援 Docker 容器化部署

## 檔案結構

- `main.py`: 主要的應用程式檔案，包含 Flask 服務和 Firebase 測試邏輯
- `requirements.txt`: Python 依賴套件清單
- `dockerfile`: Docker 容器設定檔
- `firebase-key.json`: Firebase 服務帳號金鑰檔案（需要自行配置）

## 環境需求

- Python 3.9 或以上版本
- Firebase 專案和服務帳號金鑰
- Docker（選擇性，用於容器化部署）

## 安裝與設定

1. 安裝依賴套件：
   ```bash
   pip install -r requirements.txt
   ```

2. 設定 Firebase 金鑰：
   - 將您的 `firebase-key.json` 放在專案根目錄
   - 或設定環境變數 `GOOGLE_APPLICATION_CREDENTIALS`

## 使用方法

### 本地執行

```bash
python main.py
```

服務將在 http://localhost:8080 啟動

### Docker 部署

```bash
docker build -t firebase-test .
docker run -p 8080:8080 firebase-test
```

## API 端點

1. 根路徑 `/`
   - 用於檢查服務狀態和 Firebase 初始化狀態

2. 測試寫入 `/test-write`
   - 測試 Firestore 寫入功能
   - 可選參數：`delay`（延遲秒數）
   - 範例：`/test-write?delay=5`

## 錯誤處理

- 完整的錯誤日誌記錄
- 特別處理 404 資料庫不存在錯誤
- 詳細的錯誤訊息回傳

## 注意事項

1. 請確保 `firebase-key.json` 的安全性
2. 在生產環境中建議使用環境變數或安全的金鑰管理系統
3. 本工具僅用於測試目的，不建議用於生產環境

## 授權

本專案僅供測試使用，請遵守相關的 Firebase 使用條款。