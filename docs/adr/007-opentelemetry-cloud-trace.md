# ADR-007：OpenTelemetry 分散式追蹤整合 Cloud Trace

## 狀態

已採用

## 背景

VTMap 後端的請求鏈路涉及多個外部呼叫：YouTube API、Firestore、Cloud Tasks。當效能問題或錯誤發生時，需要能追蹤一個請求從進入到完成的完整路徑，包括各段耗時。

Google Cloud Run 原生支援 Cloud Trace，但需要應用程式端配合產生 span 才能完整呈現。

## 決策

使用 **OpenTelemetry SDK** 搭配 **Cloud Trace Exporter**，僅在 Cloud Run 環境自動啟用。

### 啟用條件

透過 `K_SERVICE` 環境變數偵測是否在 Cloud Run 上運行：

```python
if not os.getenv("K_SERVICE"):
    return  # 本地開發跳過
```

### 自動攔截範圍

| Instrumentor | 攔截對象 |
|--------------|---------|
| `FlaskInstrumentor` | 所有 Flask 進入請求 |
| `RequestsInstrumentor` | 所有 `requests` 發出的 HTTP 呼叫（YouTube API 等） |

### Request ID 傳播

- `before_request` middleware 產生或接受 `X-Request-ID`
- `RequestsInstrumentor` 的 `request_hook` 將 `X-Request-ID` 注入所有 outbound HTTP header
- Cloud Run Load Balancer 的 `X-Cloud-Trace-Context` 由 `CloudTraceFormatPropagator` 解析

### 容錯設計

OpenTelemetry 初始化失敗時 **不中斷服務**，僅 log warning。tracing 是可觀測性功能，不應影響核心業務。

## 評估過的替代方案

| 方案 | 優點 | 缺點 |
|------|------|------|
| 純 Cloud Trace client library | 更輕量 | 需手動建立 span，無自動攔截 |
| Datadog / New Relic | 功能豐富 | 額外成本，與 GCP 生態整合不如原生 |
| 不做 tracing | 無額外依賴 | 跨服務問題難以排查 |

## 影響

- **正面**：零手動 span 建立即可追蹤 Flask 請求和 outbound HTTP；Cloud Trace 控制台直接可視化
- **負面**：OTel 依賴包數量較多（6+ packages）；BatchSpanProcessor 有微小記憶體開銷
- **已知限制**：本地開發無 tracing，需靠 log + `X-Request-ID` 追蹤
- **關鍵檔案**：`backend/utils/otel_setup.py`
