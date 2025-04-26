
# setup_channels.py 使用說明

## ✅ 簡介
本工具可**自動讀取 YouTube 頻道網址清單**，解析成 channel ID，並同步更新 Firestore 中的頻道資訊與頻道索引。
整合解析、資料更新、索引建立，一鍵完成，**最小化 API 請求與 Firestore 寫入**，節省成本。

---

## 📂 必要準備檔案

- `.env.local`：包含 YouTube API 金鑰與 Firestore service account 路徑
- `channel_list_handle.txt`：每行一個 YouTube 頻道網址（可混合 @handle 或 channel/UCxxx 形式）
- （可選）`handle_cache.json`：自動生成與更新，無需手動準備

---

## ⚙️ 執行流程說明

### 1. 讀取 `channel_list_handle.txt`
- 解析每行頻道網址。
- 優先使用 `handle_cache.json` 快取對照。
- 未命中快取的 handle 會呼叫 YouTube API 查詢，並即時更新快取。

### 2. 查詢頻道資訊
- 取得 `name`（頻道名稱）、`thumbnail`（頻道頭像網址）。

### 3. 更新 Firestore
- 寫入 `channel_data/{channel_id}/channel_info/info`。
- 比對 Firestore 既有資料：
  - 只在 `name` 或 `thumbnail` 變更時更新（避免不必要寫入）。
  - `updatedAt` 欄位自動更新為當前時間。

### 4. 建立頻道索引
- 寫入 `channel_index/{channel_id}`。
- 包含欄位：
  - `id`（頻道ID）
  - `name`
  - `thumbnail`
- 預設只在有變更時更新。

---

## 🧹 進階參數

| 參數 | 說明 |
| :- | :- |
| `--force` | 強制重新更新所有頻道資料與索引，即使內容沒有變更。 |

---

## 🧾 執行結果輸出

- Terminal 結束時會自動列印：
  - 成功寫入的頻道數量與 `channelId` 清單
  - 失敗的頻道數量與 `channelId` 或 handle 清單
- 同步寫入本地端 `youtube_channel_import.log`，包含：
  - 每個頻道的處理結果（成功 / 失敗）
  - 錯誤訊息（若有）
  - 執行摘要統計

---

## 🛠️ 執行指令範例

```bash
# 安裝套件
pip install -r requirements.txt

# 正常模式（自動判斷是否需要更新）
python setup_channels.py

# 強制模式（不管有沒有變更，全部重新寫入）
python setup_channels.py --force
```

---

## 📜 注意事項

- `handle_cache.json` 會自動更新，請保留於專案內以減少 API 請求次數。
- `channel_list_handle.txt` 必須存在且格式正確，否則腳本將中止。
- 失敗個案不會中斷整體流程，所有成功與失敗都會統一在結尾報告。

---

## 📚 範例目錄結構

```plaintext
your_project/
├── channel_list_handle.txt
├── handle_cache.json (自動產生)
├── .env.local
├── setup_channels.py
├── requirements.txt
├── youtube_channel_import.log (自動產生)
└── ...
```

---

## 📦 後續擴充建議
（本版暫不實作，可未來擴充）
- 支援自動從 playlist / group 抓取頻道列表。
- 自動同步頻道刪除或禁用狀態。

---

## 📝 最後總結
這版工具追求：
- 操作極簡
- 開銷最小化（節省 YouTube API、節省 Firestore 寫入）
- 支援例外錯誤不中斷
- 清楚列出成功/失敗狀態
- 自動產生完整 log 供後續檢視
