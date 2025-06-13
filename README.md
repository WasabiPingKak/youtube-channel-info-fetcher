# 🔍 頻道分析工具介紹

DEMO 網站連結：
👉 https://vtuber-channel-analyzer-v3.web.app/

本專案是一個針對 YouTube 頻道影片內容進行分類與統計分析的視覺化網站。
目標是協助創作者或觀眾快速掌握頻道內容的分佈概況，包括：

### 🔹 支援功能亮點：

- 🎥 **依影片類型分類**：支援直播、一般影片、Shorts 切換分析
- 📈 **主分類統計圖表**：以「遊戲」、「雜談」、「節目」、「音樂」等分類計算影片數與總時長
- 🧮 **分類分布圖表**：用甜甜圈圖呈現影片的數量比例與時間佔比
- 📋 **影片清單總覽**：可查閱每部影片的標題、上傳時間、分類結果與影片長度
- 🚀 **高效能設計**：針對大型頻道分析也能流暢使用，適合自動化標籤管理與內容趨勢觀察

---

## 🚀 一鍵部署指南

本專案提供完整自動化部署流程，支援 staging 與 production 雙環境，並具備版本註記與歷史版本清理功能。

---

### 🔧 後端部署（Google Cloud Run）

請先建立 `.env.local` 檔案於專案根目錄，並填入必要環境變數：

```env
API_KEY=你的API金鑰
INPUT_CHANNEL=頻道ID或@帳號
...
```

若為 production 部署，也請建立 `.env.production` 檔案，覆蓋正式參數設定。

#### 📦 自動部署後端服務

使用 `deploy_backend.sh` 自動建構映像並部署至 Cloud Run：

```bash
cd backend
./deploy_backend.sh --staging   # 部署至 Staging
./deploy_backend.sh --prod      # 部署至 Production
```

功能包含：

- 載入對應環境的 `.env` 設定
- 建立並上傳 Docker 映像至 GCR
- 寫入 Git Commit Hash 至 `version.txt`
- 初次部署自動導流，後續部署自動切換至最新 Ready 版本

#### 🔁 手動切換流量版本

僅想切換流量至最新 Ready revision 時使用：

```bash
./switch_to_latest_ready_revision.sh --staging
./switch_to_latest_ready_revision.sh --prod
```

不會重新部署，只更新 Cloud Run 的導流設定。

#### 🧹 清理舊版本 Revisions

建議定期清理 Cloud Run 的歷史版本以節省資源（保留最近 10 筆）：

```bash
./cleanup_old_revisions.sh --staging
./cleanup_old_revisions.sh --prod
```

---

### 🌐 前端部署（Firebase Hosting）

請先安裝 Firebase CLI 並初始化專案（含 `.firebaserc` 與 `firebase.json` 設定）。

#### 📦 自動部署前端網站

使用 `deploy_frontend.sh` 一鍵打包並部署：

```bash
cd frontend
./deploy_frontend.sh --staging   # 部署至 staging target
./deploy_frontend.sh --prod      # 部署至 production target
```

功能包含：

- 取得 Git Commit Hash 並插入為 `<head>` 註解
- staging 模式會將 `<title>` 顯示為「VTMap 頻道旅圖 staging」
- 執行 `npm run build --mode` 指令產出正式版本
- 使用 Firebase CLI 部署至對應 Hosting target
- 成功後自動開啟對應的網站網址（支援 macOS / Linux / Git Bash）

---

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/WasabiPingKak/youtube-channel-info-fetcher)