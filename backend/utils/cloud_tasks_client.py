"""
Cloud Tasks 工具模組 — 將任務派發到 Cloud Tasks queue 非同步執行。

用法：
    from utils.cloud_tasks_client import dispatch_task
    dispatch_task("/api/websub/subscribe-one", params={"channel_id": "UCxxx"})
"""

import logging
import os

from google.cloud import tasks_v2

logger = logging.getLogger(__name__)

# 環境變數（deploy_backend.sh 注入）
_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
_LOCATION = os.getenv("CLOUD_TASKS_LOCATION", "asia-east1")
_QUEUE_NAME = os.getenv("CLOUD_TASKS_QUEUE", "websub-subscribe")

# Cloud Run 服務自身的 URL，用來建立 task target
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
    """
    建立一個 Cloud Task，呼叫本服務的指定路徑。

    Args:
        path: API 路徑，例如 "/api/websub/subscribe-one"
        params: query string 參數，會附加在 URL 後面
        method: HTTP method（預設 POST）

    Returns:
        task name（成功時）或 None（失敗時）
    """
    if not _PROJECT_ID or not _SERVICE_URL:
        logger.error(
            f"❌ Cloud Tasks 設定不完整：PROJECT={_PROJECT_ID}, SERVICE_URL={_SERVICE_URL}"
        )
        return None

    client = _get_client()
    queue_path = client.queue_path(_PROJECT_ID, _LOCATION, _QUEUE_NAME)

    # 組裝目標 URL
    url = f"{_SERVICE_URL.rstrip('/')}{path}"
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{query}"

    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST
            if method == "POST"
            else tasks_v2.HttpMethod.GET,
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
    """
    批次建立多個 Cloud Tasks。

    Args:
        path: API 路徑
        params_list: 每個 task 的 query string 參數列表

    Returns:
        {"dispatched": int, "failed": int}
    """
    dispatched = 0
    failed = 0

    for params in params_list:
        result = dispatch_task(path, params=params, method=method)
        if result:
            dispatched += 1
        else:
            failed += 1

    return {"dispatched": dispatched, "failed": failed}
