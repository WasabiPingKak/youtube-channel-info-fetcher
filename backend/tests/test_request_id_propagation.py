"""
Request ID 傳播測試：驗證 X-Request-ID 能正確注入到各種 outbound HTTP 請求
"""

from unittest.mock import MagicMock, patch

import flask
import pytest


@pytest.fixture()
def app():
    """最小化 Flask app，僅設定 request_id middleware"""
    app = flask.Flask(__name__)

    @app.before_request
    def assign_request_id():
        flask.g.request_id = "test-rid-abc123"

    @app.route("/test")
    def test_route():
        return "ok"

    return app


class TestGetRequestId:
    def test_returns_request_id_in_context(self, app):
        from utils.request_id import get_request_id

        with app.test_request_context():
            flask.g.request_id = "rid-123"
            assert get_request_id() == "rid-123"

    def test_returns_dash_without_context(self):
        from utils.request_id import get_request_id

        assert get_request_id() == "-"

    def test_returns_dash_when_request_id_not_set(self, app):
        from utils.request_id import get_request_id

        with app.test_request_context():
            # g.request_id 未設定
            assert get_request_id() == "-"


class TestTracedHttp:
    def test_injects_request_id_header(self, app):
        from services.youtube.client import _TracedHttp

        traced_http = _TracedHttp()

        with app.test_request_context():
            flask.g.request_id = "rid-http-test"

            with patch.object(traced_http, "_conn_request") as mock_conn:
                mock_conn.return_value = (MagicMock(status=200), b"{}")
                try:
                    traced_http.request("https://example.com/api", headers={})
                except Exception:
                    pass

                # 驗證 headers 中包含 X-Request-ID
                # httplib2 內部呼叫方式較複雜，改用更直接的方式驗證
                # 透過 monkey-patch super().request 來攔截
        # 改用 integration 方式驗證：直接測試 request method override
        with app.test_request_context():
            flask.g.request_id = "rid-http-test"
            headers = {}
            # 直接呼叫 overridden request，但 mock 掉 parent
            with patch("httplib2.Http.request", return_value=(MagicMock(status=200), b"{}")):
                traced_http.request("https://example.com/api", headers=headers)
                # headers dict 是 in-place 修改的，直接檢查
                assert headers.get("X-Request-ID") == "rid-http-test"

    def test_skips_when_no_request_context(self):
        from services.youtube.client import _TracedHttp

        traced_http = _TracedHttp()
        headers = {}

        with patch("httplib2.Http.request", return_value=(MagicMock(status=200), b"{}")):
            traced_http.request("https://example.com/api", headers=headers)

        assert "X-Request-ID" not in headers

    def test_creates_headers_dict_when_none(self, app):
        from services.youtube.client import _TracedHttp

        traced_http = _TracedHttp()

        with app.test_request_context():
            flask.g.request_id = "rid-none-header"
            captured = {}

            def capture_request(
                uri, method="GET", body=None, headers=None, redirections=5, connection_type=None
            ):
                captured.update(headers or {})
                return (MagicMock(status=200), b"{}")

            with patch("httplib2.Http.request", side_effect=capture_request):
                traced_http.request("https://example.com/api")

            assert captured.get("X-Request-ID") == "rid-none-header"


class TestOtelRequestHook:
    def test_injects_request_id(self, app):
        from utils.otel_setup import _requests_request_hook

        with app.test_request_context():
            flask.g.request_id = "rid-otel-hook"
            mock_span = MagicMock()
            mock_request = MagicMock()
            mock_request.headers = {}

            _requests_request_hook(mock_span, mock_request)

            assert mock_request.headers["X-Request-ID"] == "rid-otel-hook"

    def test_skips_without_context(self):
        from utils.otel_setup import _requests_request_hook

        mock_span = MagicMock()
        mock_request = MagicMock()
        mock_request.headers = {}

        _requests_request_hook(mock_span, mock_request)

        assert "X-Request-ID" not in mock_request.headers


class TestCloudTasksRequestIdPropagation:
    @patch(
        "utils.cloud_tasks_client._get_config",
        return_value={
            "project_id": "test-project",
            "location": "asia-east1",
            "queue_name": "websub-subscribe",
            "service_url": "https://test.run.app",
        },
    )
    @patch.dict("os.environ", {"ADMIN_API_KEY": "test-key"})
    def test_task_headers_include_request_id(self, _mock_config, app):
        from utils.cloud_tasks_client import dispatch_task

        mock_client = MagicMock()
        mock_client.queue_path.return_value = "projects/test/queues/q"
        mock_task = MagicMock()
        mock_task.name = "tasks/123"
        mock_client.create_task.return_value = mock_task

        with app.test_request_context():
            flask.g.request_id = "rid-cloud-task"
            with patch("utils.cloud_tasks_client._get_client", return_value=mock_client):
                dispatch_task("/api/test")

        # 檢查 create_task 呼叫中的 task headers
        call_args = mock_client.create_task.call_args
        created_task = call_args.kwargs.get("task", call_args.args[0] if call_args.args else None)
        headers = created_task.http_request.headers
        assert headers.get("X-Request-ID") == "rid-cloud-task"

    @patch(
        "utils.cloud_tasks_client._get_config",
        return_value={
            "project_id": "test-project",
            "location": "asia-east1",
            "queue_name": "websub-subscribe",
            "service_url": "https://test.run.app",
        },
    )
    @patch.dict("os.environ", {"ADMIN_API_KEY": "test-key"})
    def test_task_headers_no_request_id_outside_context(self, _mock_config):
        from utils.cloud_tasks_client import dispatch_task

        mock_client = MagicMock()
        mock_client.queue_path.return_value = "projects/test/queues/q"
        mock_task = MagicMock()
        mock_task.name = "tasks/456"
        mock_client.create_task.return_value = mock_task

        with patch("utils.cloud_tasks_client._get_client", return_value=mock_client):
            dispatch_task("/api/test")

        created_task = mock_client.create_task.call_args.kwargs.get("task")
        if created_task is None:
            created_task = mock_client.create_task.call_args.args[0]
        headers = created_task.http_request.headers
        assert "X-Request-ID" not in headers
