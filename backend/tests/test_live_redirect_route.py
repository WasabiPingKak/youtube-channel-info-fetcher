"""
Live redirect route 測試：GET /api/live-redirect/cache
"""

import importlib
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from conftest import create_test_app

from routes.live_redirect_route import check_and_return_fresh_cache


@pytest.fixture(scope="module")
def shared_mock_db():
    return MagicMock()


@pytest.fixture(scope="module")
def redirect_app(shared_mock_db):
    import routes.live_redirect_route as mod

    importlib.reload(mod)

    app = create_test_app()
    mod.init_live_redirect_route(app, shared_mock_db)
    return app


@pytest.fixture
def client(redirect_app):
    return redirect_app.test_client()


class TestCheckAndReturnFreshCache:
    """check_and_return_fresh_cache 單元測試"""

    def test_returns_cache_within_5_minutes(self):
        db = MagicMock()
        now = datetime.now(UTC)
        cached_data = {
            "channels": [{"id": "UC_TEST"}],
            "updatedAt": (now - timedelta(minutes=2)).isoformat(),
        }
        cache_doc = MagicMock()
        cache_doc.to_dict.return_value = cached_data
        db.collection.return_value.document.return_value.get.return_value = cache_doc

        result = check_and_return_fresh_cache(db, now, force=False)
        assert result is not None
        assert result["channels"] == [{"id": "UC_TEST"}]

    def test_returns_none_when_cache_expired(self):
        db = MagicMock()
        now = datetime.now(UTC)
        cached_data = {
            "channels": [],
            "updatedAt": (now - timedelta(minutes=10)).isoformat(),
        }
        cache_doc = MagicMock()
        cache_doc.to_dict.return_value = cached_data
        db.collection.return_value.document.return_value.get.return_value = cache_doc

        result = check_and_return_fresh_cache(db, now, force=False)
        assert result is None

    def test_returns_none_when_force_refresh(self):
        db = MagicMock()
        now = datetime.now(UTC)
        cached_data = {
            "channels": [],
            "updatedAt": (now - timedelta(minutes=1)).isoformat(),
        }
        cache_doc = MagicMock()
        cache_doc.to_dict.return_value = cached_data
        db.collection.return_value.document.return_value.get.return_value = cache_doc

        result = check_and_return_fresh_cache(db, now, force=True)
        assert result is None

    def test_returns_none_when_no_updated_at(self):
        db = MagicMock()
        now = datetime.now(UTC)
        cache_doc = MagicMock()
        cache_doc.to_dict.return_value = {}
        db.collection.return_value.document.return_value.get.return_value = cache_doc

        result = check_and_return_fresh_cache(db, now, force=False)
        assert result is None

    def test_returns_none_when_invalid_date_format(self):
        db = MagicMock()
        now = datetime.now(UTC)
        cache_doc = MagicMock()
        cache_doc.to_dict.return_value = {"updatedAt": "not-a-date"}
        db.collection.return_value.document.return_value.get.return_value = cache_doc

        result = check_and_return_fresh_cache(db, now, force=False)
        assert result is None


class TestLiveRedirectCacheRoute:
    """GET /api/live-redirect/cache"""

    @patch("routes.live_redirect_route.process_video_ids")
    @patch("routes.live_redirect_route.get_pending_video_ids")
    @patch("routes.live_redirect_route.check_and_return_fresh_cache")
    def test_returns_fresh_cache_when_available(
        self, mock_check_cache, mock_pending, mock_process, client
    ):
        mock_check_cache.return_value = {"channels": [{"id": "UC_CACHED"}]}
        resp = client.get("/api/live-redirect/cache")
        assert resp.status_code == 200
        assert resp.get_json()["channels"] == [{"id": "UC_CACHED"}]
        mock_pending.assert_not_called()

    @patch("routes.live_redirect_route.process_video_ids")
    @patch("routes.live_redirect_route.get_pending_video_ids")
    @patch("routes.live_redirect_route.check_and_return_fresh_cache")
    def test_rebuilds_when_cache_stale(self, mock_check_cache, mock_pending, mock_process, client):
        mock_check_cache.return_value = None
        mock_pending.return_value = ["video_1", "video_2"]
        mock_process.return_value = {"channels": [{"id": "UC_NEW"}]}

        resp = client.get("/api/live-redirect/cache")
        assert resp.status_code == 200
        assert resp.get_json()["channels"] == [{"id": "UC_NEW"}]

    @patch("routes.live_redirect_route.process_video_ids")
    @patch("routes.live_redirect_route.get_pending_video_ids")
    def test_skip_cache_bypasses_cache_check(self, mock_pending, mock_process, client):
        mock_pending.return_value = []
        mock_process.return_value = {"channels": []}

        resp = client.get("/api/live-redirect/cache?skipCache=true")
        assert resp.status_code == 200

    @patch("routes.live_redirect_route.get_pending_video_ids")
    @patch("routes.live_redirect_route.check_and_return_fresh_cache")
    def test_exception_returns_500(self, mock_check_cache, mock_pending, client):
        mock_check_cache.return_value = None
        mock_pending.side_effect = Exception("Firestore down")

        resp = client.get("/api/live-redirect/cache")
        assert resp.status_code == 500
        assert resp.get_json()["error"] == "伺服器內部錯誤"
