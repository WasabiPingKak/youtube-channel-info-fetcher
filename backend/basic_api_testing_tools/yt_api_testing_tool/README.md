# YouTube API 測試工具

這是一個用於測試 YouTube Data API 功能的簡單工具，主要用於驗證 API 連接和基本功能是否正常運作。

## 功能特點

- 支援透過頻道 ID 或使用者名稱查詢 YouTube 頻道
- 自動獲取頻道的上傳播放清單
- 獲取頻道最新影片的詳細資訊
- 完整的錯誤處理和日誌記錄
- 支援環境變數配置

## 系統需求

- Python 3.6 或更高版本
- 有效的 YouTube Data API 金鑰

## 安裝步驟

1. 安裝所需套件：
   ```bash
   pip install -r requirements.txt
   ```

2. 建立 `.env` 檔案並設定以下環境變數：
   ```
   API_KEY=你的YouTube_API金鑰
   INPUT_CHANNEL=目標頻道ID或使用者名稱（例如：@channelname）
   ```

## 使用方法

### 方法一：使用 Shell 腳本

直接執行 `run_test.sh`：
```bash
./run_test.sh
```

### 方法二：直接執行 Python 腳本

```bash
python youtube_api_test.py
```

## 輸出說明

程式執行後會顯示：
- 頻道最新影片的標題
- 影片 ID
- 發布時間
- 影片時長

## 錯誤處理

- 所有錯誤都會被記錄並顯示在控制台
- 主要錯誤類型：
  - API 金鑰無效
  - 頻道不存在
  - API 請求失敗
  - 資料解析錯誤

## 注意事項

- 請確保 API 金鑰具有足夠的配額
- 預設只獲取最新的 10 部影片
- 建議在正式環境使用前先進行測試

## 檔案結構

- `youtube_api_test.py`: 主要的測試程式碼
- `requirements.txt`: 相依套件清單
- `run_test.sh`: 執行腳本
- `.env`: 環境變數設定檔（需要自行建立）
- `.gitignore`: Git 忽略檔案設定