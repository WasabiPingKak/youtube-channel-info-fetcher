# YouTube 頻道資訊獲取器後端

這是一個用於獲取和分析 YouTube 頻道資訊的後端服務。

## 專案結構

```
backend/
├── routes/          # API 路由定義
├── services/        # 業務邏輯服務
├── utils/           # 工具函數
├── app.py          # 應用程式入口點
├── requirements.txt # Python 依賴套件
└── Dockerfile      # Docker 容器設定
```

## 主要功能

1. **YouTube 頻道資訊獲取**
   - 獲取頻道基本資訊
   - 獲取頻道影片列表
   - 影片內容分析

2. **影片分類系統**
   - 自動分類影片
   - 分類規則管理
   - 分類結果儲存

3. **快取機制**
   - 影片資訊快取
   - 分類結果快取
   - 快取更新管理

## 技術架構

- **後端框架**：Flask
- **資料庫**：Firebase/Firestore
- **API**：RESTful API
- **容器化**：Docker
- **部署**：可通過 `deploy_backend.sh` 腳本部署

## 環境需求

- Python 3.8+
- Firebase 專案設定
- YouTube Data API 金鑰

## 安裝與設定

1. **安裝依賴套件**
   ```bash
   pip install -r requirements.txt
   ```

2. **設定環境變數**
   - 設定 Firebase 認證
   - 設定 YouTube API 金鑰

3. **啟動服務**
   ```bash
   python app.py
   ```

## API 文件

詳細的 API 文件請參考：
- [路由說明文件](routes/README.md)
- [服務層說明文件](services/README.md)
- [工具函數說明文件](utils/README.md)

## 部署說明

使用 `deploy_backend.sh` 腳本進行部署：
```bash
./deploy_backend.sh
```

## 開發指南

1. **程式碼風格**
   - 遵循 PEP 8 規範
   - 使用 Type Hints
   - 撰寫完整的文檔字串

2. **測試**
   - 使用 pytest 進行測試
   - 確保測試覆蓋率
   - 撰寫單元測試和整合測試

3. **錯誤處理**
   - 使用適當的錯誤處理機制
   - 記錄錯誤日誌
   - 提供有意義的錯誤訊息

## 維護說明

- 定期更新依賴套件
- 監控 API 使用量
- 檢查快取效能
- 維護分類規則

## 注意事項

- 確保 API 金鑰的安全性
- 遵守 YouTube API 使用限制
- 定期備份資料庫
- 監控系統資源使用情況