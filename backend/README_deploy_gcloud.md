# 🚀 deploy_gcloud.sh 使用說明

這個腳本會自動完成以下操作：

1. 讀取 `.env.deploy` 環境變數（例如 `API_KEY`, `INPUT_CHANNEL`）
2. 使用 Dockerfile 建構映像檔
3. 將映像推送到 GCR（Google Container Registry）
4. 部署到 Cloud Run（使用 `--no-traffic`）
5. 顯示部署後的測試 URL
6. 提示是否要立即將流量導向新版本
7. 自動清理舊的 revisions（只保留最新 N 個）

---

## 📝 前置準備

### 1. 建立 `.env.deploy` 環境變數檔案

請在專案根目錄建立 `.env.deploy`（**不要加入 Git**）：

```env
API_KEY=your_youtube_api_key
INPUT_CHANNEL=your_channel_id_or_handle
```

> ✅ 建議將 `.env.deploy` 加入 `.gitignore`

---

### 2. 確保你的專案結構中有：

- `Dockerfile`（在專案根目錄）
- Flask 程式的進入點為 `app.py`
- 正確的 `requirements.txt`

---

## 📦 執行部署

```bash
./deploy_gcloud.sh
```

---

## 🚦 流量切換機制

部署成功後，腳本會提示：

```
✅ 要將流量切換到新 revision 嗎？(y/N):
```

- 輸入 `y` → 立即將流量 100% 導向最新版本
- 其他輸入 → 保持測試狀態，可使用顯示的 URL 測試新版

---

## 🧹 清理規則

腳本會自動：

- 清除舊的 Cloud Run revisions
- 只保留最新的 `KEEP_REVISIONS=5` 個版本（可在腳本中調整）

---

## 🧪 測試 URL 範例輸出

部署後會顯示：

```
🔗 可用於測試的 URL：https://youtube-api-service-xxxxx-uc.a.run.app
```

你可以用這個網址驗證新版功能是否正確。

---

## ✅ 相依工具

請確認你已安裝以下 CLI 工具，並登入 GCP：

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```
