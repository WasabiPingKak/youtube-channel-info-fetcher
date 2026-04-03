# ADR-004：自製 Circuit Breaker 保護外部服務

## 狀態

已採用

## 背景

VTMap 依賴兩個外部服務：YouTube Data API v3 與 Google Cloud Firestore。當這些服務異常時，持續重試會：

- 拖慢所有請求的回應時間
- 浪費 YouTube API quota
- 可能觸發下游的 rate limiting

需要一個機制在偵測到持續失敗時快速失敗（fail fast），等服務恢復後再放行。

## 決策

自製 **thread-safe 三狀態 Circuit Breaker**，為 YouTube API 與 Firestore 各建立獨立實例。

### 狀態機

```
CLOSED ──（連續失敗 ≥ 5 次）──→ OPEN
  ↑                                │
  │                        （冷卻 30 秒後 lazy 轉換）
  │                                ↓
  └──（試探成功）──── HALF_OPEN ──（試探失敗）──→ OPEN
```

### 參數設定

| 參數 | YouTube API | Firestore | 說明 |
|------|-------------|-----------|------|
| `failure_threshold` | 5 | 5 | 連續失敗幾次觸發熔斷 |
| `recovery_timeout` | 30s | 30s | 熔斷後冷卻時間 |
| `half_open_max_calls` | 1 | 1 | HALF_OPEN 允許的試探次數 |

### 關鍵設計

- **Lazy state transition**：OPEN → HALF_OPEN 在 `state` property 存取時才判斷，不依賴 timer thread
- **Excluded exceptions**：business logic 錯誤（如 ValueError）不計入失敗次數
- **Global registry**：所有 breaker 實例註冊到 `_registry`，health check endpoint 可一次查詢全部狀態
- **Decorator 模式**：`@circuit_breaker(breaker)` 透明包裝既有函式
- **Thread safety**：所有狀態變更在 `threading.Lock` 保護下進行

### Health Check 整合

`/health` endpoint 回傳所有 breaker 狀態，當任一 breaker 為 OPEN 時，health check 仍回 200（服務本身正常），但回應中包含降級資訊。

## 評估過的替代方案

| 方案 | 優點 | 缺點 |
|------|------|------|
| pybreaker | 成熟的第三方套件 | 多一個 dependency，自訂彈性較低 |
| tenacity retry | 內建 retry 機制 | 只有 retry，沒有 circuit breaking 概念 |
| 不做保護 | 最簡單 | 外部服務故障時全站拖慢 |

## 影響

- **正面**：外部服務故障時秒級快速失敗，不拖慢整體回應；health check 提供即時可觀測性
- **負面**：自製實作需自行維護；`threading.Lock` 在高併發場景有微小效能開銷
- **已知限制**：每個 Cloud Run instance 獨立計算失敗次數，不跨 instance 共享狀態
- **關鍵檔案**：`backend/utils/circuit_breaker.py`、`backend/utils/breaker_instances.py`
