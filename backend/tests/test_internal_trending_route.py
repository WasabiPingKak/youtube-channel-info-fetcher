"""
Internal trending route 測試：admin-only 趨勢建構與快取刷新
"""

import importlib
import os
from unittest.mock import MagicMock, patch

import pytest
from conftest import create_test_app

from schemas import register_validation_error_handler

ADMIN_KEY = os.environ["ADMIN_API_KEY"]
ADMIN_HEADERS = {"Authorization": f"Bearer {ADMIN_KEY}"}


@pytest.fixture(scope="module")
def shared_mock_db():
    return MagicMock()


@pytest.fixture(scope="module")
def trending_app(shared_mock_db):
    import routes.internal_trending_route as mod

    importlib.reload(mod)

    app = create_test_app()
    register_validation_error_handler(app)
    mod.init_internal_trending_route(app, shared_mock_db)
    return app


@pytest.fixture
def trending_client(trending_app):
    return trending_app.test_client()


class TestBuildDailyTrending:
    """POST /api/internal/build-daily-trending"""

    def test_no_auth_returns_401(self, trending_client):
        resp = trending_client.post(
            "/api/internal/build-daily-trending",
            json={},
        )
        assert resp.status_code == 401

    def test_wrong_key_returns_401(self, trending_client):
        resp = trending_client.post(
            "/api/internal/build-daily-trending",
            json={},
            headers={"Authorization": "Bearer wrong-key"},
        )
        assert resp.status_code == 401

    @patch("routes.internal_trending_route.build_trending_for_date_range")
    def test_default_params(self, mock_build, trending_client):
        mock_build.return_value = {"status": "ok", "processed": 1}
        resp = trending_client.post(
            "/api/internal/build-daily-trending",
            json={},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"

    @patch("routes.internal_trending_route.build_trending_for_date_range")
    def test_custom_start_date(self, mock_build, trending_client):
        mock_build.return_value = {"status": "ok"}
        resp = trending_client.post(
            "/api/internal/build-daily-trending",
            json={"startDate": "2026-03-01", "days": 7, "force": True},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        mock_build.assert_called_once_with(
            "2026-03-01", 7, pytest.approx(MagicMock(), abs=1), force=True
        )

    @patch("routes.internal_trending_route.build_trending_for_date_range")
    def test_exception_returns_500(self, mock_build, trending_client):
        mock_build.side_effect = Exception("build failed")
        resp = trending_client.post(
            "/api/internal/build-daily-trending",
            json={},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 500
        assert resp.get_json()["error"] == "伺服器內部錯誤"


class TestRefreshDailyCache:
    """POST /api/internal/refresh-daily-cache"""

    @patch("routes.internal_trending_route.run_daily_channel_refresh")
    def test_default_params(self, mock_refresh, trending_client):
        mock_refresh.return_value = {"refreshed": 10}
        resp = trending_client.post(
            "/api/internal/refresh-daily-cache",
            json={},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.get_json()["refreshed"] == 10

    @patch("routes.internal_trending_route.run_daily_channel_refresh")
    def test_custom_params(self, mock_refresh, trending_client):
        mock_refresh.return_value = {"refreshed": 5}
        resp = trending_client.post(
            "/api/internal/refresh-daily-cache",
            json={"limit": 5, "dry_run": True, "full_scan": True},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        call_kwargs = mock_refresh.call_args[1]
        assert call_kwargs["limit"] == 5
        assert call_kwargs["dry_run"] is True
        assert call_kwargs["full_scan"] is True

    @patch("routes.internal_trending_route.run_daily_channel_refresh")
    def test_exception_returns_500(self, mock_refresh, trending_client):
        mock_refresh.side_effect = Exception("refresh failed")
        resp = trending_client.post(
            "/api/internal/refresh-daily-cache",
            json={},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 500

    def test_no_auth_returns_401(self, trending_client):
        resp = trending_client.post(
            "/api/internal/refresh-daily-cache",
            json={},
        )
        assert resp.status_code == 401
