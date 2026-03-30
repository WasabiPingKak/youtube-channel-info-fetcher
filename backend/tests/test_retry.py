"""
retry 工具測試：驗證 exponential backoff 與可重試錯誤判斷
"""

from unittest.mock import MagicMock, patch

import pytest
from requests.exceptions import ConnectionError as ReqConnectionError
from requests.exceptions import Timeout

from utils.retry import _is_retryable, retry_on_transient_error


class TestIsRetryable:
    def test_http_error_429(self):
        """YouTube API quota/rate limit → 可重試"""
        error = MagicMock()
        error.resp = MagicMock()
        error.resp.status = 429
        assert _is_retryable(error) is True

    def test_http_error_503(self):
        """YouTube API 暫時不可用 → 可重試"""
        error = MagicMock()
        error.resp = MagicMock()
        error.resp.status = 503
        assert _is_retryable(error) is True

    def test_http_error_403(self):
        """403 通常是權限問題 → 不重試"""
        error = MagicMock()
        error.resp = MagicMock()
        error.resp.status = 403
        assert _is_retryable(error) is False

    def test_http_error_404(self):
        """404 → 不重試"""
        error = MagicMock()
        error.resp = MagicMock()
        error.resp.status = 404
        assert _is_retryable(error) is False

    def test_timeout(self):
        assert _is_retryable(Timeout("timeout")) is True

    def test_connection_error(self):
        assert _is_retryable(ReqConnectionError("refused")) is True

    def test_builtin_timeout_error(self):
        assert _is_retryable(TimeoutError("socket timeout")) is True

    def test_value_error_not_retryable(self):
        assert _is_retryable(ValueError("bad data")) is False

    def test_requests_http_error_with_500_response(self):
        from requests.exceptions import HTTPError

        error = HTTPError()
        error.response = MagicMock()
        error.response.status_code = 500
        assert _is_retryable(error) is True

    def test_requests_http_error_with_400_response(self):
        from requests.exceptions import HTTPError

        error = HTTPError()
        error.response = MagicMock()
        error.response.status_code = 400
        assert _is_retryable(error) is False


class TestRetryOnTransientError:
    @patch("utils.retry.time.sleep")
    def test_retries_on_transient_error(self, mock_sleep):
        call_count = 0

        @retry_on_transient_error(max_retries=3, base_delay=1.0)
        def flaky_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Timeout("temporary failure")
            return "success"

        result = flaky_func()
        assert result == "success"
        assert call_count == 3
        assert mock_sleep.call_count == 2

    @patch("utils.retry.time.sleep")
    def test_exponential_backoff_delays(self, mock_sleep):
        @retry_on_transient_error(max_retries=3, base_delay=2.0, max_delay=10.0)
        def always_fail():
            raise Timeout("fail")

        with pytest.raises(Timeout):
            always_fail()

        delays = [call.args[0] for call in mock_sleep.call_args_list]
        assert delays == [2.0, 4.0, 8.0]

    @patch("utils.retry.time.sleep")
    def test_respects_max_delay(self, mock_sleep):
        @retry_on_transient_error(max_retries=5, base_delay=2.0, max_delay=5.0)
        def always_fail():
            raise Timeout("fail")

        with pytest.raises(Timeout):
            always_fail()

        delays = [call.args[0] for call in mock_sleep.call_args_list]
        assert all(d <= 5.0 for d in delays)

    def test_no_retry_on_non_transient_error(self):
        call_count = 0

        @retry_on_transient_error(max_retries=3, base_delay=0.01)
        def bad_func():
            nonlocal call_count
            call_count += 1
            raise ValueError("permanent error")

        with pytest.raises(ValueError):
            bad_func()
        assert call_count == 1

    def test_success_on_first_try(self):
        @retry_on_transient_error(max_retries=3)
        def good_func():
            return 42

        assert good_func() == 42

    @patch("utils.retry.time.sleep")
    def test_raises_after_max_retries(self, mock_sleep):
        @retry_on_transient_error(max_retries=2, base_delay=0.01)
        def always_fail():
            raise Timeout("persistent failure")

        with pytest.raises(Timeout, match="persistent failure"):
            always_fail()

    @patch("utils.retry.time.sleep")
    def test_retries_googleapiclient_http_error(self, mock_sleep):
        call_count = 0
        error = MagicMock()
        error.resp = MagicMock()
        error.resp.status = 503

        class FakeHttpError(Exception):
            def __init__(self):
                self.resp = MagicMock()
                self.resp.status = 503
                super().__init__("service unavailable")

        @retry_on_transient_error(max_retries=2, base_delay=1.0)
        def api_call():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise FakeHttpError()
            return "ok"

        result = api_call()
        assert result == "ok"
        assert call_count == 3
