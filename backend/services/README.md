# 服務層（Service Layer）說明文件

本目錄負責定義所有後端的業務邏輯，與資料來源（如 Firestore、YouTube API）進行互動，並對上層路由提供統一的服務介面。

---

## 📦 核心服務（Core Services）

### `firebase_init_service.py`
- **用途**：Firebase 連線與初始化管理
- **功能**：
  - 初始化 Firebase Admin SDK
  - 建立 Firestore 資料庫連線
  - 管理服務帳戶憑證載入

### `firestore_settings_service.py`
- **用途**：Firestore 分類設定管理
- **功能**：
  - 讀取與儲存頻道個別的分類設定（`settings/config` 文件）

### `video_cache_service.py`
- **用途**：影片快取資料管理
- **功能**：
  - 從 YouTube API 取得影片資料並分類
  - 將整理後的影片寫入 Firestore 的快取區（`videos/`）
  - 重新套用最新分類設定到既有影片快取

### `category_service.py`
- **用途**：全局分類資料（categories）管理
- **功能**：
  - 讀取所有分類資料
  - 同步（新增、合併、取代）分類與關鍵字

---

## 🎬 YouTube 相關服務（YouTube Services）

### `youtube/`
- **用途**：封裝 YouTube Data API 互動邏輯
- **功能**：
  - 取得頻道基本資訊（名稱、頭像）
  - 取得頻道影片清單（支援條件篩選）
  - 處理 YouTube 影片資料正規化

---

## 🛠️ 附註

- 所有服務模組應專注於業務邏輯，避免直接處理 HTTP 請求或回應。
- 與外部 API（如 YouTube）互動的模組，集中於 `youtube/` 子目錄內。
- Firebase Admin 初始化與資料庫連線管理集中於單一服務（`firebase_init_service.py`）。

---
