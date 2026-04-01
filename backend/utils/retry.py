# utils/retry.py
# 輕量級 retry 工具，用於外部 API 呼叫（YouTube API、Google API）

import logging
import time
from functools import wraps

logger = logging.getLogger(__name__)

# YouTube API 可重試的 HTTP 狀態碼
RETRYABLE_STATUS_CODES = {429, 500, 502, 503}


def retry_on_transient_error(
    max_retries: int = 3, base_delay: float = 1.0, max_delay: float = 30.0
):
    """
    Decorator：對暫時性錯誤自動重試（exponential backoff）。

    支援：
    - googleapiclient.errors.HttpError（429/5xx）
    - requests.exceptions.RequestException
    - ConnectionError / TimeoutError

    Args:
        max_retries: 最大重試次數（不含首次呼叫）
        base_delay: 首次重試等待秒數
        max_delay: 最大等待秒數
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception: Exception | None = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if not _is_retryable(e) or attempt >= max_retries:
                        raise
                    last_exception = e
                    delay = min(base_delay * (2**attempt), max_delay)
                    logger.warning(
                        "⏳ [%s] 第 %d/%d 次重試（%.1fs 後）：%s",
                        func.__name__,
                        attempt + 1,
                        max_retries,
                        delay,
                        e,
                    )
                    time.sleep(delay)

            if last_exception is not None:  # pragma: no cover
                raise last_exception
            raise RuntimeError("retry_on_transient_error 內部邏輯錯誤")  # pragma: no cover

        return wrapper

    return decorator


def _is_retryable(error: Exception) -> bool:
    """判斷是否為可重試的暫時性錯誤"""
    # googleapiclient.errors.HttpError
    resp = getattr(error, "resp", None)
    if resp is not None and hasattr(resp, "status"):
        return resp.status in RETRYABLE_STATUS_CODES

    # requests.exceptions.RequestException（連線逾時、網路中斷）
    from requests.exceptions import ConnectionError as ReqConnectionError
    from requests.exceptions import Timeout

    if isinstance(error, Timeout | ReqConnectionError | ConnectionError | TimeoutError):
        return True

    # requests.exceptions.HTTPError（有 response 物件）
    response = getattr(error, "response", None)
    if response is not None:
        return response.status_code in RETRYABLE_STATUS_CODES

    return False
