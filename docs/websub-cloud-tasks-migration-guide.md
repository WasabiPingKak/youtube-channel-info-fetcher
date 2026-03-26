# WebSub 訂閱機制改用 Cloud Tasks 遷移指南

## 問題背景

`websub-subscribe-all` Cloud Scheduler job 長期失敗，原因：
- 同步迴圈逐一訂閱所有頻道，頻道數多時超過 Cloud Scheduler / Cloud Run timeout
- Cloud Scheduler 預設 HTTP timeout 約 180 秒，頻道數超過 ~100 就會超時
- 失敗後 Cloud Tasks 自動 retry，但每次都會再超時，形成永久失敗

## 解決方案

將 `subscribe-all` 從「同步迴圈」改為「Cloud Tasks 非同步派發」：

```
之前：Scheduler → subscribe-all → for 迴圈逐一訂閱 200+ 頻道 → timeout ❌
之後：Scheduler → subscribe-all → 建立 200+ 個 Cloud Task（幾秒完成）✅
                                        ↓
                Cloud Tasks → subscribe-one?channel_id=UC001
                Cloud Tasks → subscribe-one?channel_id=UC002
                ...（每個獨立執行，失敗自動 retry）
```

## 需要的變更

### 1. GCP 設定（一次性）

```bash
# 啟用 Cloud Tasks API
gcloud services enable cloudtasks.googleapis.com

# 建立 queue（每秒最多 5 個、最多同時 5 個、失敗重試 3 次）
gcloud tasks queues create websub-subscribe \
  --location=asia-east1 \
  --max-dispatches-per-second=5 \
  --max-concurrent-dispatches=5 \
  --max-attempts=3 \
  --min-backoff=10s
```

### 2. 新增套件

在 `requirements.txt` 加入：
```
google-cloud-tasks
```

### 3. 新增 Cloud Tasks 工具模組

建立 `utils/cloud_tasks_client.py`：

```python
"""
Cloud Tasks 工具模組 — 將任務派發到 Cloud Tasks queue 非同步執行。
"""

import json
import logging
import os

from google.cloud import tasks_v2
from google.protobuf import timestamp_pb2

logger = logging.getLogger(__name__)

_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
_LOCATION = os.getenv("CLOUD_TASKS_LOCATION", "asia-east1")
_QUEUE_NAME = os.getenv("CLOUD_TASKS_QUEUE", "websub-subscribe")
_SERVICE_URL = os.getenv("CLOUD_RUN_SERVICE_URL", "")

_client = None


def _get_client() -> tasks_v2.CloudTasksClient:
    global _client
    if _client is None:
        _client = tasks_v2.CloudTasksClient()
    return _client


def dispatch_task(
    path: str,
    *,
    params: dict | None = None,
    method: str = "POST",
) -> str | None:
    if not _PROJECT_ID or not _SERVICE_URL:
        logger.error(
            "❌ Cloud Tasks 設定不完整："
            f"PROJECT={_PROJECT_ID}, SERVICE_URL={_SERVICE_URL}"
        )
        return None

    client = _get_client()
    queue_path = client.queue_path(_PROJECT_ID, _LOCATION, _QUEUE_NAME)

    url = f"{_SERVICE_URL.rstrip('/')}{path}"
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{query}"

    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST if method == "POST" else tasks_v2.HttpMethod.GET,
            "url": url,
            "headers": {"Content-Type": "application/json"},
        }
    }

    try:
        created = client.create_task(parent=queue_path, task=task)
        logger.info(f"📤 已建立 Cloud Task：{created.name}")
        return created.name
    except Exception:
        logger.error(f"🔥 建立 Cloud Task 失敗：{url}", exc_info=True)
        return None


def dispatch_tasks_batch(
    path: str,
    *,
    params_list: list[dict],
    method: str = "POST",
) -> dict:
    dispatched = 0
    failed = 0
    for params in params_list:
        result = dispatch_task(path, params=params, method=method)
        if result:
            dispatched += 1
        else:
            failed += 1
    return {"dispatched": dispatched, "failed": failed}
```

### 4. 改寫 websub subscribe route

**關鍵改動：**

- `subscribe-all`：不再 for 迴圈呼叫 PubSubHubbub，改為建立 Cloud Tasks
- `subscribe-one`：保留原有訂閱邏輯，作為 Cloud Task 的 handler
- `subscribe-one` 失敗時回傳 HTTP 500，讓 Cloud Tasks 自動 retry
- `CALLBACK_URL` 改為每次 request 時讀取（避免 module-level 快取問題）
- 新增 `_log_job_result()` 寫入 Firestore `scheduler_job_logs` 記錄執行結果

```python
# subscribe-all 核心邏輯（簡化版）
def subscribe_all_channels():
    channels = 從 Firestore 讀取頻道列表

    # 過濾出有效 channel_id
    valid_params = [{"channel_id": ch["channel_id"]} for ch in channels if ch.get("channel_id")]

    # 透過 Cloud Tasks 批次派發
    result = dispatch_tasks_batch("/api/websub/subscribe-one", params_list=valid_params)

    # 記錄到 Firestore
    _log_job_result(db, "websub-subscribe-all", result)
    return jsonify(result), 200
```

### 5. 部署腳本新增環境變數

在 `deploy_backend.sh` 的 `--set-env-vars` 加入：

```
CLOUD_TASKS_LOCATION=${REGION}
CLOUD_TASKS_QUEUE=websub-subscribe
CLOUD_RUN_SERVICE_URL=${CLOUD_RUN_SERVICE_URL}
```

其中 `CLOUD_RUN_SERVICE_URL` 在部署前取得：

```bash
CLOUD_RUN_SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format="value(status.url)" 2>/dev/null || echo "")
```

### 6. Cloud Scheduler 確認事項

確保 `websub-subscribe-all` job 的目標 URL 指向 **production** service，不是 staging。

## 同時要檢查的其他排程 Job

在這次排查中也發現了其他問題，遷移時請一併檢查：

| 檢查項目 | 說明 |
|----------|------|
| 所有 Cloud Scheduler 目標 URL | 確認指向正確環境（production / staging） |
| `WEBSUB_CALLBACK_URL` 環境變數 | Production 服務必須指向 production callback URL |
| Maintenance clean jobs | 確認清理 job 打的是 production，不是 staging |

## 費用

Cloud Tasks 每月前 100 萬次免費。200~500 頻道每 3 天執行一次 ≈ 每月數千次，完全在免費額度內。
