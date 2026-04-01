"""
Circuit Breaker 測試：驗證熔斷器狀態機、decorator、registry、health check 整合
"""

from unittest.mock import MagicMock, patch

import pytest

from utils.circuit_breaker import (
    CircuitBreaker,
    CircuitOpenError,
    CircuitState,
    _registry,
    circuit_breaker,
    get_all_breaker_statuses,
    get_breaker,
)


@pytest.fixture(autouse=True)
def clean_registry():
    """每個測試後清理 registry，避免測試間互相干擾"""
    saved = dict(_registry)
    yield
    _registry.clear()
    _registry.update(saved)


def make_breaker(**kwargs) -> CircuitBreaker:
    """建立測試用 breaker（避免名稱衝突）"""
    name = kwargs.pop("name", f"test_{id(kwargs)}")
    return CircuitBreaker(name=name, **kwargs)


class TestCircuitBreakerState:
    """熔斷器狀態機測試"""

    def test_initial_state_is_closed(self):
        cb = make_breaker()
        assert cb.state == CircuitState.CLOSED

    def test_stays_closed_on_success(self):
        cb = make_breaker(failure_threshold=3)
        cb.record_success()
        cb.record_success()
        assert cb.state == CircuitState.CLOSED

    def test_stays_closed_below_threshold(self):
        cb = make_breaker(failure_threshold=3)
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.CLOSED

    def test_opens_after_failure_threshold(self):
        cb = make_breaker(failure_threshold=3)
        for _ in range(3):
            cb.record_failure()
        assert cb.state == CircuitState.OPEN

    def test_rejects_calls_when_open(self):
        cb = make_breaker(failure_threshold=2)
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        assert cb.allow_request() is False

    def test_success_resets_failure_count(self):
        """成功呼叫應重置失敗計數"""
        cb = make_breaker(failure_threshold=3)
        cb.record_failure()
        cb.record_failure()
        cb.record_success()  # 重置
        cb.record_failure()
        cb.record_failure()
        # 只有 2 次連續失敗，不應開啟
        assert cb.state == CircuitState.CLOSED

    @patch("utils.circuit_breaker.time.monotonic")
    def test_transitions_to_half_open_after_timeout(self, mock_monotonic):
        cb = make_breaker(failure_threshold=2, recovery_timeout=10.0)
        mock_monotonic.return_value = 100.0
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN

        # 未到冷卻時間
        mock_monotonic.return_value = 109.0
        assert cb.state == CircuitState.OPEN

        # 到達冷卻時間
        mock_monotonic.return_value = 110.0
        assert cb.state == CircuitState.HALF_OPEN

    @patch("utils.circuit_breaker.time.monotonic")
    def test_half_open_allows_limited_calls(self, mock_monotonic):
        cb = make_breaker(failure_threshold=2, recovery_timeout=5.0, half_open_max_calls=1)
        mock_monotonic.return_value = 0.0
        cb.record_failure()
        cb.record_failure()

        mock_monotonic.return_value = 10.0  # 過了冷卻期
        assert cb.allow_request() is True  # 第 1 次試探
        assert cb.allow_request() is False  # 超過限制

    @patch("utils.circuit_breaker.time.monotonic")
    def test_half_open_to_closed_on_success(self, mock_monotonic):
        cb = make_breaker(failure_threshold=2, recovery_timeout=5.0)
        mock_monotonic.return_value = 0.0
        cb.record_failure()
        cb.record_failure()

        mock_monotonic.return_value = 10.0
        assert cb.state == CircuitState.HALF_OPEN
        cb.record_success()
        assert cb.state == CircuitState.CLOSED

    @patch("utils.circuit_breaker.time.monotonic")
    def test_half_open_to_open_on_failure(self, mock_monotonic):
        cb = make_breaker(failure_threshold=2, recovery_timeout=5.0)
        mock_monotonic.return_value = 0.0
        cb.record_failure()
        cb.record_failure()

        mock_monotonic.return_value = 10.0
        assert cb.state == CircuitState.HALF_OPEN
        cb.record_failure()
        assert cb.state == CircuitState.OPEN

    def test_get_status_returns_correct_dict(self):
        cb = make_breaker(failure_threshold=3)
        status = cb.get_status()
        assert status == {"state": "closed", "failure_count": 0}

        cb.record_failure()
        cb.record_failure()
        status = cb.get_status()
        assert status == {"state": "closed", "failure_count": 2}

    def test_reset(self):
        cb = make_breaker(failure_threshold=2)
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        cb.reset()
        assert cb.state == CircuitState.CLOSED
        assert cb.get_status()["failure_count"] == 0

    def test_state_transition_logging(self, caplog):
        """狀態轉換時應產生 WARNING log"""
        cb = make_breaker(name="test_logging", failure_threshold=2)
        with caplog.at_level("WARNING", logger="utils.circuit_breaker"):
            cb.record_failure()
            cb.record_failure()
        assert "CLOSED → OPEN" in caplog.text
        assert "test_logging" in caplog.text


class TestCircuitBreakerDecorator:
    """Decorator 測試"""

    def test_passes_through_when_closed(self):
        cb = make_breaker()
        mock_fn = MagicMock(return_value="ok")
        decorated = circuit_breaker(cb)(mock_fn)

        result = decorated()
        assert result == "ok"
        mock_fn.assert_called_once()

    def test_raises_circuit_open_error_when_open(self):
        cb = make_breaker(failure_threshold=1)
        cb.record_failure()

        mock_fn = MagicMock()
        decorated = circuit_breaker(cb)(mock_fn)

        with pytest.raises(CircuitOpenError) as exc_info:
            decorated()
        assert cb.name in str(exc_info.value)
        mock_fn.assert_not_called()

    def test_records_failure_on_exception(self):
        cb = make_breaker(failure_threshold=5)
        mock_fn = MagicMock(side_effect=RuntimeError("boom"))
        decorated = circuit_breaker(cb)(mock_fn)

        with pytest.raises(RuntimeError):
            decorated()
        assert cb.get_status()["failure_count"] == 1

    def test_records_success_on_normal_return(self):
        cb = make_breaker(failure_threshold=5)
        cb.record_failure()  # 先記錄一次失敗
        mock_fn = MagicMock(return_value="ok")
        decorated = circuit_breaker(cb)(mock_fn)

        decorated()
        assert cb.get_status()["failure_count"] == 0  # 成功後重置

    def test_excluded_exceptions_dont_count(self):
        cb = make_breaker(failure_threshold=2)
        mock_fn = MagicMock(side_effect=ValueError("not a service error"))
        decorated = circuit_breaker(cb, excluded_exceptions=(ValueError,))(mock_fn)

        with pytest.raises(ValueError):
            decorated()
        assert cb.get_status()["failure_count"] == 0  # 不計入

    def test_composes_with_retry(self):
        """Circuit breaker 包在 retry 外層 — open 時不進 retry"""
        cb = make_breaker(failure_threshold=1)
        cb.record_failure()  # 觸發 OPEN

        call_count = 0

        def inner():
            nonlocal call_count
            call_count += 1
            return "ok"

        # 模擬 @circuit_breaker(cb) @retry 的堆疊
        from utils.retry import retry_on_transient_error

        decorated = circuit_breaker(cb)(
            retry_on_transient_error(max_retries=3, base_delay=0.01)(inner)
        )

        with pytest.raises(CircuitOpenError):
            decorated()
        assert call_count == 0  # retry 根本沒被執行


class TestRegistry:
    """Registry 功能測試"""

    def test_breaker_registered_on_creation(self):
        cb = CircuitBreaker(name="reg_test")
        assert get_breaker("reg_test") is cb

    def test_get_breaker_returns_none_for_unknown(self):
        assert get_breaker("nonexistent") is None

    def test_get_all_breaker_statuses(self):
        CircuitBreaker(name="status_a")
        CircuitBreaker(name="status_b")
        statuses = get_all_breaker_statuses()
        assert "status_a" in statuses
        assert "status_b" in statuses
        assert statuses["status_a"]["state"] == "closed"
