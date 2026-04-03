# ADR-003：領域例外階層與全域錯誤處理

## 狀態

已採用

## 背景

路由層（routes）若各自 try/except 處理錯誤，會導致：

- 錯誤回應格式不一致（有些回 `{"error": ...}`，有些回 `{"message": ...}`）
- HTTP 狀態碼散落在各 route，維護困難
- 業務邏輯與錯誤處理耦合

## 決策

建立 **領域導向的例外階層**，搭配 Flask **全域 error handler** 自動將例外轉為統一格式的 HTTP 回應。

### 例外階層

```
AppError (500)
├── NotFoundError (404)
├── AuthorizationError (403)
├── ConfigurationError (500)
└── ExternalServiceError (502)

CircuitOpenError (503)  ← 獨立於 AppError，由 circuit breaker 拋出
```

### 設計原則

- **AppError** 為基底類別，攜帶 `message`（使用者可見）、`status_code`、`log_message`（內部 log 用，不回傳前端）
- 5xx 用 `logging.exception` 記錄完整 stack trace，4xx 用 `logging.warning`
- 額外攔截 `GoogleAPIError`（Firestore 操作失敗 → 500）和 `HttpError`（YouTube API → 502）
- Pydantic `ValidationError` 由 `schemas/__init__.py` 另外處理，轉為 422 + 欄位級錯誤明細

### 路由層寫法

路由層只需 raise 對應例外，不需 try/except：

```python
channel = db.collection("channels").document(channel_id).get()
if not channel.exists:
    raise NotFoundError("找不到該頻道")
```

## 影響

- **正面**：路由層程式碼乾淨，只關心業務邏輯；錯誤回應格式 100% 一致
- **負面**：新增例外類型需同步更新 error handler（目前由繼承 AppError 自動涵蓋）
- **關鍵檔案**：`backend/utils/exceptions.py`、`backend/schemas/__init__.py`
