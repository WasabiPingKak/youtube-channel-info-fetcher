# ADR-001：使用 APIFlask + Application Factory 模式

## 狀態

已採用

## 背景

VTMap 後端需要一個 Python Web 框架，需求包括：

- 自動產生 OpenAPI 3.1 規格與 Swagger UI，降低前後端溝通成本
- 支援 Pydantic v2 做請求驗證
- 能在測試中透過自訂 config 建立獨立 app 實例（避免全域狀態污染）
- 社群活躍、學習曲線低

## 決策

採用 **APIFlask**（Flask 的 API 開發擴充）搭配 **Application Factory 模式**。

### Application Factory 設計

`create_app(config=None)` 集中管理所有初始化邏輯：

1. 環境變數載入（本地 `.env.local`，Cloud Run 由平台注入）
2. Middleware 設定（ProxyFix、CORS、Security Headers、Request ID）
3. Rate Limiter、OpenTelemetry 初始化
4. 全域錯誤處理器註冊
5. KMS Guardrail（部署環境強制要求 KMS 設定）
6. Firestore 客戶端初始化
7. Route 自動註冊

### OpenAPI 控制

Swagger UI 僅在 staging 環境啟用（`enable_openapi=is_staging`），避免 production 暴露 API 文件。

## 評估過的替代方案

| 方案 | 優點 | 缺點 |
|------|------|------|
| FastAPI | 原生 async、自動 OpenAPI | 需要 ASGI server，與 Firebase Admin SDK（sync）整合複雜 |
| 純 Flask | 最輕量 | 無內建 OpenAPI，需額外整合 flask-smorest 或手寫 spec |
| Django REST | 功能完整 | 對 Firestore（非 ORM）專案過重 |

## 影響

- **正面**：自動 OpenAPI spec 確保文件與程式碼同步；Factory 模式讓測試可傳入 `{"TESTING": True}` 建立乾淨實例
- **負面**：APIFlask 社群規模小於 FastAPI，部分進階需求需查閱 Flask 文件
- **關鍵檔案**：`backend/app.py`
