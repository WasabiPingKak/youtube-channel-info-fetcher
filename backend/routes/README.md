# YouTube 頻道資訊快取系統 - 路由說明文件

本目錄包含 YouTube 頻道資訊快取系統的所有 API 路由定義，負責影片資料的快取、分類設定、分類套用與管理功能。

---

## 📦 路由結構

### 1. 基礎路由（`base_routes.py`）
- **主要功能**：
  - 提供基礎系統健康檢查（如 `/ping`）
- **API**：
  - `GET /api/ping`
    - **回應格式**：
      ```json
      {
        "message": "pong"
      }
      ```

---

### 2. 快取相關路由

#### 2.1 頻道影片快取（`cache_channel_videos.py`）
- **主要功能**：
  - 根據頻道 ID 和日期範圍抓取影片資料
  - 自動分類後快取到 Firestore
  - 支援增量更新，避免重複處理

- **API**：
  - `POST /api/cache/channel-videos`
    - **請求格式**：
      ```json
      {
        "channel_id": "YouTube頻道ID",
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD"
      }
      ```
    - **回應格式**：
      ```json
      {
        "channel_id": "YouTube頻道ID",
        "cached": 10,
        "skipped": 5,
        "videos": [
          {
            "videoId": "影片ID",
            "title": "影片標題",
            "publishDate": "發布日期",
            "duration": 3600,
            "type": "video",
            "matchedCategories": ["分類1", "分類2"],
            "game": "遊戲名稱",
            "matchedKeywords": ["關鍵字1", "關鍵字2"]
          }
        ]
      }
      ```

#### 2.2 快取分類與儲存（`cache_routes.py`）
- **主要功能**：
  - 提供整合式影片分類與快取功能
  - 支援指定時間區間處理

- **API**：
  - `POST /api/cache/classify-and-save`
    - **請求格式**：
      ```json
      {
        "channel_id": "YouTube頻道ID",
        "start": "YYYY-MM-DD",  // 選填
        "end": "YYYY-MM-DD"     // 選填
      }
      ```
    - **回應格式**：
      ```json
      {
        "message": "✅ 已完成分類並寫入快取",
        "count": 15
      }
      ```

---

### 3. 分類管理路由

#### 3.1 分類資料管理（`category_routes.py`）
- **主要功能**：
  - 提供分類（categories）資料的讀取與同步 API

- **API**：
  - `GET /api/categories`
    - **用途**：取得所有分類資料
    - **回應格式**：
      ```json
      [
        {
          "id": "分類ID",
          "category": "分類名稱",
          "keywords": ["關鍵字1", "關鍵字2"]
        }
      ]
      ```

  - `POST /api/categories/sync`
    - **用途**：同步（新增/合併/更新）分類資料
    - **請求格式**（單筆或多筆皆可）：
      ```json
      [
        {
          "name": "分類名稱",
          "keywords": ["關鍵字1", "關鍵字2"],
          "mode": "sync" // 或 "replace"
        }
      ]
      ```
    - **回應格式**：
      ```json
      {
        "message": "同步完成"
      }
      ```

#### 3.2 分類設定套用（`category_save_apply_routes.py`）
- **主要功能**：
  - 讀取並套用最新分類設定到影片快取
  - 更新影片的分類標籤與關聯資料

- **API**（預計設計，但目前較偏內部調用，視未來是否開放）

---

### 4. Firestore 設定管理路由（`firestore_settings_routes.py`）
- **主要功能**：
  - 讀取或更新頻道個別的分類設定（存放於 `settings/config` 文件）

- **API**：
  - `POST /api/firestore/load-category-settings`
    - **用途**：讀取指定頻道的分類設定
    - **請求格式**：
      ```json
      {
        "channel_id": "YouTube頻道ID"
      }
      ```
    - **回應格式**（成功）：
      ```json
      {
        "success": true,
        "settings": { ... }
      }
      ```
    - **回應格式**（失敗）：
      ```json
      {
        "success": false,
        "error": "NOT_FOUND",
        "code": "not-found"
      }
      ```

---

## ⚠️ 錯誤處理

- 所有 API 出錯時統一回傳 JSON 格式：
  ```json
  {
    "error": "錯誤訊息描述"
  }
  ```

- 常見 HTTP 狀態碼：
  | 狀態碼 | 意義 |
  |:---|:---|
  | 200 | 請求成功 |
  | 400 | 請求參數錯誤 |
  | 404 | 找不到資源 |
  | 500 | 伺服器內部錯誤 |

---

## 🛡️ 使用說明與設計原則

- 所有路由遵循 RESTful API 設計風格
- 支援台北時區（Asia/Taipei）時間處理
- 各功能皆有完整例外處理與日誌記錄
- 路由層處理請求與回應，資料處理邏輯由 services 層負責
- 新增路由時請遵循 Blueprint 註冊模式與錯誤管理規範
- 新增功能時須同步更新本文件

---
