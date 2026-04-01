"""
base_routes 測試：healthz 端點的 Firestore + Cloud Tasks 健康檢查
"""

import importlib
from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import create_test_app


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def healthy_app(mock_db):
    """每次建立全新 blueprint，避免 Flask 的 blueprint 重複註冊限制"""
    import routes.base_routes as mod

    importlib.reload(mod)
    app = create_test_app()
    mod.init_base_routes(app, mock_db)
    return app


class TestHealthz:
    """/healthz 深度健康檢查"""

    def test_all_healthy(self, healthy_app, mock_db):
        mock_db.collection.return_value.limit.return_value.get.return_value = []
        cloud_tasks_ok = {"healthy": True, "reason": None}

        with patch("routes.base_routes.check_cloud_tasks_health", return_value=cloud_tasks_ok):
            client = healthy_app.test_client()
            resp = client.get("/healthz")

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "healthy"
        assert data["checks"]["firestore"]["healthy"] is True
        assert data["checks"]["cloud_tasks"]["healthy"] is True

    def test_firestore_unhealthy(self, healthy_app, mock_db):
        mock_db.collection.return_value.limit.return_value.get.side_effect = Exception(
            "connection refused"
        )
        cloud_tasks_ok = {"healthy": True, "reason": None}

        with patch("routes.base_routes.check_cloud_tasks_health", return_value=cloud_tasks_ok):
            client = healthy_app.test_client()
            resp = client.get("/healthz")

        assert resp.status_code == 503
        data = resp.get_json()
        assert data["status"] == "unhealthy"
        assert data["checks"]["firestore"]["healthy"] is False

    def test_cloud_tasks_unhealthy(self, healthy_app, mock_db):
        mock_db.collection.return_value.limit.return_value.get.return_value = []
        cloud_tasks_bad = {"healthy": False, "reason": "Cloud Tasks API 未啟用或權限不足"}

        with patch("routes.base_routes.check_cloud_tasks_health", return_value=cloud_tasks_bad):
            client = healthy_app.test_client()
            resp = client.get("/healthz")

        assert resp.status_code == 503
        data = resp.get_json()
        assert data["status"] == "unhealthy"
        assert data["checks"]["cloud_tasks"]["healthy"] is False
        assert "未啟用" in data["checks"]["cloud_tasks"]["reason"]

    def test_firestore_not_initialized(self):
        """db=None 的情況"""
        import routes.base_routes as mod

        importlib.reload(mod)
        app = create_test_app()
        mod.init_base_routes(app, db=None)
        cloud_tasks_ok = {"healthy": True, "reason": None}

        with patch("routes.base_routes.check_cloud_tasks_health", return_value=cloud_tasks_ok):
            client = app.test_client()
            resp = client.get("/healthz")

        assert resp.status_code == 503
        data = resp.get_json()
        assert data["checks"]["firestore"]["healthy"] is False
        assert "未初始化" in data["checks"]["firestore"]["reason"]

    def test_both_unhealthy(self, healthy_app, mock_db):
        mock_db.collection.return_value.limit.return_value.get.side_effect = Exception("timeout")
        cloud_tasks_bad = {"healthy": False, "reason": "Queue 不存在：websub-subscribe"}

        with patch("routes.base_routes.check_cloud_tasks_health", return_value=cloud_tasks_bad):
            client = healthy_app.test_client()
            resp = client.get("/healthz")

        assert resp.status_code == 503
        data = resp.get_json()
        assert data["status"] == "unhealthy"
        assert data["checks"]["firestore"]["healthy"] is False
        assert data["checks"]["cloud_tasks"]["healthy"] is False
