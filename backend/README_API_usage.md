# 📌 API 文件：`POST /api/categories/sync`

## 📋 功能簡介
此 API 用來**同步整份主題分類資料**，根據前端送來的清單自動進行新增或更新，支援兩種模式：

- `"sync"`：**新增不重複的關鍵字**，保留原有資料。
- `"replace"`：**完全覆寫**既有關鍵字陣列。

---

## 🔧 請求方式
- **方法**：`POST`
- **路徑**：`/api/categories/sync`
- **內容類型**：`application/json`
- **身分驗證**：無（依實作設定）

---

## 📨 Request Body 格式

```json
[
  {
    "name": "雜談",
    "keywords": ["聊天", "閒聊", "閒談"],
    "mode": "sync"
  },
  {
    "name": "音樂",
    "keywords": ["唱歌", "演奏", "BGM"],
    "mode": "replace"
  }
]
```

### 欄位說明：

| 欄位     | 類型       | 是否必填 | 說明                                      |
|----------|------------|----------|-------------------------------------------|
| `name`   | `string`   | ✅       | 分類名稱（唯一）                         |
| `keywords` | `string[]` | ✅       | 關鍵字陣列                                |
| `mode`   | `string`   | ❌       | 可選，`"sync"`（預設）或 `"replace"`     |

---

## 📦 後端處理邏輯

對每筆分類項目進行以下判斷：

### 若分類名稱已存在：

| 模式       | 處理邏輯                                      |
|------------|-----------------------------------------------|
| `sync`     | 加入新的關鍵字（避免重複），保留原本的關鍵字 |
| `replace`  | 完全覆蓋原本的關鍵字陣列                      |

### 若分類名稱不存在：

- 新增一筆分類，並建立 `keywords` 欄位。

---

## ✅ 成功回應：

```json
{
  "message": "同步完成"
}
```

---

## ⚠️ 錯誤回應：

```json
{
  "error": "請傳入分類陣列"
}
```

（若請求格式錯誤或不是陣列時會出現）

---

## 🧪 測試建議（curl 範例）：

```bash
curl -X POST https://your-domain/api/categories/sync \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "雜談",
      "keywords": ["聊天", "閒聊"],
      "mode": "sync"
    }
  ]'
```

# 📦 API 文件：影片快取功能

## ✅ `/refresh-cache`

### 📋 功能說明
取得指定日期區間內的影片資料並**合併到快取**中（不重複新增）。

### 🔧 方法與路徑
- 方法：`GET`
- 路徑：`/refresh-cache`
- 查詢參數（Query Parameters）：
  - `start`：開始日期（格式：`YYYY-MM-DD`）
  - `end`：結束日期（格式：`YYYY-MM-DD`）

### 📥 範例請求
```
GET /refresh-cache?start=2024-12-01&end=2024-12-31
```

### ✅ 成功回應
```json
{
  "message": "✅ 快取已合併更新",
  "total": 123,
  "new_added": 15
}
```

---

## 🧨 `/api/cache/overwrite`

### 📋 功能說明
**強制重新快取**指定日期區間內的影片資料，並**完整覆寫原本的快取資料**，不管是否重複。

### 🔧 方法與路徑
- 方法：`POST`
- 路徑：`/api/cache/overwrite`
- Content-Type：`application/json`

### 📥 Request Body
```json
{
  "start": "2024-12-01",
  "end": "2024-12-31"
}
```

### ✅ 成功回應
```json
{
  "message": "🧨 快取已強制覆寫",
  "count": 48
}
```

---

## 🧪 測試建議

### 合併模式（refresh-cache）
```bash
curl "https://your-domain/refresh-cache?start=2024-12-01&end=2024-12-31"
```

### 強制覆寫模式
```bash
curl -X POST https://your-domain/api/cache/overwrite \
  -H "Content-Type: application/json" \
  -d '{"start": "2024-12-01", "end": "2024-12-31"}'
```