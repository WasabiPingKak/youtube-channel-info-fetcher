"""
Cloud Tasks 工具模組 — 將任務派發到 Cloud Tasks queue 非同步執行。

用法：
    from utils.cloud_tasks_client import dispatch_task
    dispatch_task("/api/websub/subscribe-one", params={"channel_id": "UCxxx"})
"""

import logging
import os
from urllib.parse import urlencode

from google.cloud import tasks_v2

logger = logging.getLogger(__name__)


def _get_config():
    """延遲讀取環境變數，避免 import time 綁定"""
    return {
        "project_id": os.getenv("GOOGLE_CLOUD_PROJECT", ""),
        "location": os.getenv("CLOUD_TASKS_LOCATION", "asia-east1"),
        "queue_name": os.getenv("CLOUD_TASKS_QUEUE", "websub-subscribe"),
        "service_url": os.getenv("CLOUD_RUN_SERVICE_URL", ""),
    }


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
    config = _get_config()
    project_id = config["project_id"]
    service_url = config["service_url"]

    if not project_id or not service_url:
        logger.error(f"❌ Cloud Tasks 設定不完整：PROJECT={project_id}, SERVICE_URL={service_url}")
        return None

    client = _get_client()
    queue_path = client.queue_path(project_id, config["location"], config["queue_name"])

    # 組裝目標 URL
    url = f"{service_url.rstrip('/')}{path}"
    if params:
        url = f"{url}?{urlencode(params)}"

    # Cloud Tasks 帶 Admin Key，讓 worker endpoint 驗證來源
    admin_key = os.getenv("ADMIN_API_KEY", "")
    headers = {"Content-Type": "application/json"}
    if admin_key:
        headers["Authorization"] = f"Bearer {admin_key}"

    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST
            if method == "POST"
            else tasks_v2.HttpMethod.GET,
            "url": url,
            "headers": headers,
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
    max_workers: int = 10,
) -> dict:
    """
    批次建立多個 Cloud Tasks（並行執行）。

    Args:
        path: API 路徑
        params_list: 每個 task 的 query string 參數列表
        method: HTTP method（預設 POST）
        max_workers: 最大並行數（預設 10）

    Returns:
        {"dispatched": int, "failed": int}
    """
    import concurrent.futures

    dispatched = 0
    failed = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(dispatch_task, path, params=params, method=method): params
            for params in params_list
        }
        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                if result:
                    dispatched += 1
                else:
                    failed += 1
            except Exception:
                logger.exception("🔥 批次派發 task 時發生例外")
                failed += 1

    return {"dispatched": dispatched, "failed": failed}
