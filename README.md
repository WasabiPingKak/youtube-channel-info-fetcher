DEMO 網站連結：
https://vtuber-channel-analyzer-v3.web.app/videos?channel=UCLxa0YOtqi8IR5r2dSLXPng

🔍 頻道分析工具介紹

本專案是一個針對 YouTube 頻道影片內容進行分類與統計分析的視覺化網站。
目標是協助創作者或觀眾快速掌握頻道內容的分佈概況，包括：

🎥 依影片類型分類：支援直播、一般影片、Shorts 切換分析

📈 主分類統計圖表：以「遊戲」、「雜談」、「節目」、「音樂」等分類計算影片數與總時長

🧮 分類分布圖表：用甜甜圈圖呈現影片的數量比例與時間佔比

📋 影片清單總覽：可查閱每部影片的標題、上傳時間、分類結果與影片長度

🚀 對大型頻道的分析亦支援良好效能表現，適合用於自動化影片標籤管理或內容趨勢觀察

本系統仍在 Beta 階段開發中。


## 🚀 一鍵部署指南

### 🔧 後端：部署到 Google Cloud Run

請先確認你已在根目錄設好 `.env.local`，內容範例如下：

```env
API_KEY=你的API金鑰
INPUT_CHANNEL=頻道ID或@帳號
```

然後進入 `backend/` 資料夾並執行：

```bash
cd backend
./deploy_backend.sh
```

✅ 此腳本將自動完成以下步驟：
- 載入環境變數
- 建立並上傳容器映像至 GCR
- 部署至 Cloud Run，導流量至最新版本
- 顯示部署成功的網址

---

### 🌐 前端：部署到 Firebase Hosting

請確認已登入 Firebase CLI，並已初始化專案（含 `firebase.json` 設定完成）。接著在 `frontend/` 執行：

```bash
cd frontend
./deploy_frontend.sh
```

✅ 此腳本將自動完成以下步驟：
- 取得當前 Git Commit Hash 並嵌入標題
- 建立正式版 `build`（自動關閉 /settings）
- 部署至 Firebase Hosting
- 顯示並自動打開 Hosting 網址

---

如需切換至維護模式，請手動替換 `index.html` 為維護頁版本後重新部署。
