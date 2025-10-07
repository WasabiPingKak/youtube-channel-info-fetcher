[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/WasabiPingKak/youtube-channel-info-fetcher)

# 🎯 VTMap 頻道旅圖｜Vtuber TrailMap

https://www.vtubertrailmap.com/

VTMap 是一套針對 Vtuber 頻道經營的分析與導流工具，目的是為了解決 YouTube 後台缺乏「主題分類」與「直播導流」資訊的限制。

透過標題關鍵字比對來分類影片主題，協助創作者與觀眾快速掌握頻道內容，也提供具彈性的自訂規則與隱私設定。

本專案涵蓋資料擷取、分類邏輯設計、前後端系統架構，以及雲端部署流程，並支援 staging／production 雙環境的開發與部署。

實作上整合了 YouTube Data API、Firebase Firestore 資料庫與 Google Apps Script 提供的 Web API，並從綠界科技（ECPay）取得使用者贊助留言。整體設計支援創作者即時查看頻道內容結構與導流曝光，提供比 Youtube 原生介面更多的參考資訊。

---

### 🔍 我能用 VTMap 做什麼？

#### 📊 頻道分析 Channel Analyzer

- 自動掃描所有影片標題，依據關鍵字歸類為四大主題：「雜談」「遊戲」「音樂」「節目」
- 統計影片數量與總時長，產出主題比例圖與分布趨勢
- 快速查閱每部影片的標題、時間、主題分類與長度
- 頻道持有者可自訂頻道的分類關鍵字，協助系統針對頻道的個人風格做更精準的分類

#### 🛬 降落轉機塔臺 Live Redirect Helper

- 自動替每場直播貼上主題分類標籤
- 顯示「同時觀看人數」、「開播時間」、「主題」等資訊
- 可依主題分類與人氣排序篩選導流對象
- 解決 YouTube 官方導流系統無法顯示分類、時間與同時觀看人數的問題

---

### 🗃️ 給頻道擁有者的自訂功能

VTMap 支援創作者透過 Google OAuth 登入，並連結自己的 YouTube 頻道，使用進階功管理功能：

- 可以開關頻道分析頁與導流頁的觀看權限
- 可對頻道設定自訂的主題分類關鍵字，讓分類更貼近頻道風格

此外，VTMap 提供開放式資料整合機制，讓創作者或觀眾能在不進入後台的情況下，透過提交 Google Sheets 表單來協作擴充遊戲清單。

經由 Google Apps Script 將 Google Sheets 表單轉換為 JSON API，後端可即時讀取最新的遊戲別名設定。

---

## 🚀 一鍵部署指南

本專案可部署 staging 與 production 雙環境，並具備版本註記與歷史版本清理功能。

---

### 🔧 後端部署（Google Cloud Run）

請進入 `backend/` 目錄，建立 `.env.local` 環境變數檔案，並依需求建立 `.env.production` 覆蓋正式部署設定。

可參考 `backend/.env.example` 範例如下：

```env
export API_KEY=YOUTUBE_API_KEY
export INPUT_CHANNEL=UCxxxxxxxxxxxxxx (API 測試用欄位，非必要)
export GOOGLE_CLIENT_ID=xxx
export GOOGLE_CLIENT_SECRET=xxx
export GOOGLE_REDIRECT_URI=https://xxx
export FRONTEND_BASE_URL=https://xxx
export OAUTH_DEBUG_MODE=true
export FIREBASE_KEY_PATH=xxx
export GOOGLE_APPLICATION_CREDENTIALS=xxx
export JWT_SECRET=xxx
export ALLOWED_ORIGINS=https://xxxxx
export ADMIN_API_KEY=xxxxx (系統管理員的 bearer token)
export WEBSUB_CALLBACK_URL=https://xxxxx/websub-callback
export ECPAY_MERCHANT_ID=xxxxx
export ECPAY_HASH_KEY=xxxxx
export ECPAY_HASH_IV=xxxxx
```

`.env.production` 通常會設定正式用網址與導向參數，例如：

```env
export GOOGLE_REDIRECT_URI=https://xxxxx/oauth/callback
export FRONTEND_BASE_URL=https://xxxxx
export ALLOWED_ORIGINS=https://xxxxx
```

---

#### 📦 自動部署後端服務

使用 `deploy_backend.sh` 自動建構映像並部署至 Cloud Run：

```bash
cd backend
./deploy_backend.sh --staging   # 部署至 Staging
./deploy_backend.sh --prod      # 部署至 Production
```

功能包含：

- 載入對應 `.env` 設定檔內容
- 建立並上傳 Docker 映像至 Google Container Registry（GCR）
- 寫入 Git Commit Hash 至 `version.txt`
- 若是首次部署自動導流；後續部署自動切換至最新 READY 版本

---

#### 🔁 手動切換流量版本

若不想重新部署，只切換流量到最新版本，可使用：

```bash
./switch_to_latest_ready_revision.sh --staging
./switch_to_latest_ready_revision.sh --prod
```

---

#### 🧹 清理舊版本 Revisions

定期清理 Cloud Run 歷史版本以節省資源（保留最近 10 筆）：

```bash
./cleanup_old_revisions.sh --staging
./cleanup_old_revisions.sh --prod
```

---

### 🌐 前端部署（Firebase Hosting）

請先安裝 Firebase CLI，並於 `frontend/` 目錄中完成初始化（需有 `.firebaserc` 與 `firebase.json` 設定）。

#### 📦 自動部署前端網站

使用 `deploy_frontend.sh` 一鍵打包並部署：

```bash
cd frontend
./deploy_frontend.sh --staging   # 部署至 staging target
./deploy_frontend.sh --prod      # 部署至 production target
```

功能包含：

- 取得 Git Commit Hash 並插入至 `<head>` 中註解
- `staging` 模式會將 `<title>` 改為「VTMap 頻道旅圖 staging」
- 執行 `npm run build -- --mode` 指令產出正式版
- 使用 Firebase CLI 部署至對應 Hosting target
