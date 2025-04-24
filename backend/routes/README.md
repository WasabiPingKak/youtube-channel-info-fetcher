# API 路由說明文件

本目錄包含所有 API 路由的實現。以下是各個路由的詳細說明：

## 分類相關 API

### GET /api/categories
- **用途**：獲取所有分類
- **方法**：GET
- **回應**：返回所有分類的列表
- **錯誤處理**：如果發生錯誤，返回 500 錯誤

### POST /api/categories/sync
- **用途**：同步分類資料
- **方法**：POST
- **請求體**：分類陣列
- **回應**：同步完成訊息
- **錯誤處理**：
  - 400：請求格式錯誤
  - 500：伺服器內部錯誤

## 快取相關 API

### POST /api/cache/classify-and-save
- **用途**：對 YouTube 頻道影片進行分類並儲存到快取
- **方法**：POST
- **請求體**：
  ```json
  {
    "channel_id": "YouTube頻道ID",
    "start": "開始日期 (YYYY-MM-DD)",
    "end": "結束日期 (YYYY-MM-DD)"
  }
  ```
- **回應**：
  ```json
  {
    "message": "✅ 已完成分類並寫入快取",
    "count": 處理的影片數量
  }
  ```
- **錯誤處理**：
  - 400：缺少必要參數
  - 500：伺服器內部錯誤

## 其他路由文件
- `base_routes.py`：基礎路由設定
- `cache_channel_videos.py`：頻道影片快取相關路由
- `category_save_apply_routes.py`：分類儲存和應用相關路由
- `firestore_settings.py`：Firestore 設定相關路由