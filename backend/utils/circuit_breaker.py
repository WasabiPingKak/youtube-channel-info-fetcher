# utils/circuit_breaker.py
# 熔斷器模組 — 當外部服務持續失敗時自動熔斷，避免無效重試拖慢系統

import logging
import threading
import time
from enum import Enum
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """熔斷器狀態"""

    CLOSED = "closed"  # 正常運作
    OPEN = "open"  # 熔斷中，所有呼叫立即失敗
    HALF_OPEN = "half_open"  # 試探中，允許少量呼叫測試恢復


class CircuitOpenError(Exception):
    """熔斷器已開啟，呼叫被拒絕"""

    def __init__(self, breaker_name: str):
        self.breaker_name = breaker_name
        super().__init__(f"Circuit breaker '{breaker_name}' is OPEN")


# 全域 registry，集中管理所有 breaker 實例
_registry: dict[str, "CircuitBreaker"] = {}


def get_breaker(name: str) -> "CircuitBreaker | None":
    """依名稱取得 breaker 實例"""
    return _registry.get(name)


def get_all_breaker_statuses() -> dict[str, dict]:
    """取得所有 breaker 的狀態（供 health check 使用）"""
    return {name: breaker.get_status() for name, breaker in _registry.items()}


class CircuitBreaker:
    """Thread-safe 熔斷器

    Parameters
    ----------
    name : str
        熔斷器名稱（同時作為 registry key）
    failure_threshold : int
        連續失敗幾次後觸發熔斷
    recovery_timeout : float
        熔斷後等待多久（秒）才進入 HALF_OPEN 試探
    half_open_max_calls : int
        HALF_OPEN 狀態下最多允許幾次試探呼叫
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 1,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: float = 0.0
        self._half_open_calls = 0
        self._lock = threading.Lock()

        # 註冊到全域 registry
        _registry[name] = self

    @property
    def state(self) -> CircuitState:
        """取得目前狀態（含 OPEN→HALF_OPEN 的 lazy 轉換）"""
        with self._lock:
            if (
                self._state == CircuitState.OPEN
                and time.monotonic() - self._last_failure_time >= self.recovery_timeout
            ):
                self._state = CircuitState.HALF_OPEN
                self._half_open_calls = 0
                logger.warning(
                    "🔄 [CircuitBreaker] %s: OPEN → HALF_OPEN（冷卻 %.0fs 已到）",
                    self.name,
                    self.recovery_timeout,
                )
            return self._state

    def allow_request(self) -> bool:
        """檢查是否允許發送請求"""
        current_state = self.state  # 觸發 lazy 轉換
        with self._lock:
            if current_state == CircuitState.CLOSED:
                return True
            if current_state == CircuitState.HALF_OPEN:
                if self._half_open_calls < self.half_open_max_calls:
                    self._half_open_calls += 1
                    return True
                return False
            return False  # OPEN

    def record_success(self) -> None:
        """記錄成功呼叫"""
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                logger.warning(
                    "✅ [CircuitBreaker] %s: HALF_OPEN → CLOSED（試探成功）",
                    self.name,
                )
                self._state = CircuitState.CLOSED
            self._failure_count = 0

    def record_failure(self) -> None:
        """記錄失敗呼叫"""
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.monotonic()

            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                logger.warning(
                    "🔴 [CircuitBreaker] %s: HALF_OPEN → OPEN（試探失敗）",
                    self.name,
                )
            elif (
                self._state == CircuitState.CLOSED and self._failure_count >= self.failure_threshold
            ):
                self._state = CircuitState.OPEN
                logger.warning(
                    "🔴 [CircuitBreaker] %s: CLOSED → OPEN（連續失敗 %d 次）",
                    self.name,
                    self._failure_count,
                )

    def get_status(self) -> dict:
        """取得狀態快照（供 health check / 監控使用）"""
        current_state = self.state  # 觸發 lazy 轉換
        with self._lock:
            return {
                "state": current_state.value,
                "failure_count": self._failure_count,
            }

    def reset(self) -> None:
        """重置熔斷器（主要供測試使用）"""
        with self._lock:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._last_failure_time = 0.0
            self._half_open_calls = 0


def circuit_breaker(
    breaker: CircuitBreaker,
    excluded_exceptions: tuple[type[Exception], ...] = (),
):
    """Decorator：為函式加上熔斷保護

    Parameters
    ----------
    breaker : CircuitBreaker
        要使用的熔斷器實例
    excluded_exceptions : tuple[type[Exception], ...]
        不計入失敗次數的例外類型（如 ValueError、KeyError 等應用邏輯錯誤）
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not breaker.allow_request():
                raise CircuitOpenError(breaker.name)

            try:
                result = func(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                if isinstance(e, excluded_exceptions):
                    raise
                breaker.record_failure()
                raise

        return wrapper

    return decorator
