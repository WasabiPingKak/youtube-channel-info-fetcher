
# youtube_channel_import.py 使用說明

## ✅ 簡介

本工具可**自動讀取 YouTube 頻道網址清單**，解析為頻道 ID，並同步更新 Firestore 中的頻道資訊與頻道索引。
整合解析、快取、API 擷取與資料寫入，一鍵完成。
模組化設計，維護簡單，**最小化 API 請求與 Firestore 寫入成本**。

---

## 📂 必要檔案

| 檔案名稱              | 說明                                           |
|-----------------------|------------------------------------------------|
| `.env.local`          | 環境變數設定，需包含 `API_KEY` 與 `FIREBASE_KEY_PATH` |
| `channel_list_handle.txt` | 每行一個頻道網址，可為 `@handle` 或 `channel/UCxxxx` |
| `handle_cache.json`   | 自動生成與更新的 handle-to-ID 對照快取（選填）   |

---

## ⚙️ 執行流程說明

### 1. 載入 handle 清單與快取

- 讀取 `channel_list_handle.txt`
- 使用正規表達式解析出 UCID 或 @handle
- 優先查找 `handle_cache.json`，減少 API 次數
- 未命中快取的 @handle 會呼叫 YouTube API 查詢，並即時更新快取

### 2. 查詢頻道資訊

- 使用 YouTube Data API 查詢：
  - `name`（頻道名稱）
  - `thumbnail`（頭像網址）

### 3. 寫入 Firestore

- 寫入 `channel_data/{channel_id}/channel_info/info`
  - 只在資料有變更時才會更新（避免不必要的寫入）
  - 自動填入 `updatedAt = SERVER_TIMESTAMP`
- 建立或更新 `channel_index/{channel_id}`
  - 包含 `name`、`thumbnail`、`url`、`enabled`、`priority`
- 若 `channel_data/{channel_id}/settings/config` 尚未存在，則自動從 `config_default.json` 初始化分類設定

---

## 🧹 參數說明

| 參數       | 說明                                                   |
|------------|--------------------------------------------------------|
| `--force`  | 強制重新寫入 Firestore 資料，即使內容無變化也會更新 |

---

## 🧾 執行結果輸出

- 執行結束後：
  - **終端列印**：成功與失敗的頻道清單與總數
  - **log 檔**：`youtube_channel_import.log`，包含詳細處理過程與錯誤紀錄

---

## 🛠️ 執行方式

```bash
# 安裝依賴套件
pip install -r requirements.txt

# 執行（自動判斷哪些需要更新）
python youtube_channel_import.py

# 強制全部更新（不管有無變更）
python youtube_channel_import.py --force
```

---

## 📜 注意事項

- `channel_list_handle.txt` 是必要檔案，未提供將中止執行
- `handle_cache.json` 為快取機制，自動生成與更新，請勿手動編輯
- 即使部分頻道解析失敗，也不會中止整體流程，結果將記錄於 log 中

---

## 📁 目錄範例

```plaintext
youtube_tools/
├── youtube_channel_import.py          # 主程式
├── channel_list_handle.txt            # 頻道網址清單
├── handle_cache.json                  # 快取（自動產生）
├── youtube_channel_import.log         # log（自動產生）
├── .env.local                         # API 金鑰與金鑰路徑
├── config_default.json                # 預設分類設定（自動寫入 settings/config）
├── core/                              # 程式模組
│   ├── constants.py
│   ├── env.py
│   ├── log_setup.py
│   ├── youtube_api.py
│   ├── firestore_writer.py
│   ├── handle_utils.py
│   └── config_initializer.py
```
