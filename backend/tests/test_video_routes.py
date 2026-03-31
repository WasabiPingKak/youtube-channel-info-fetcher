"""
Video routes 測試：/api/videos/classified 與 /api/videos/check-update
"""

import importlib
from unittest.mock import MagicMock, patch

import pytest
from conftest import create_test_app

from schemas import register_validation_error_handler


@pytest.fixture(scope="module")
def shared_mock_db():
    return MagicMock()


@pytest.fixture(scope="module")
def video_app(shared_mock_db):
    import routes.video_routes as mod

    importlib.reload(mod)

    app = create_test_app()
    register_validation_error_handler(app)
    mod.init_video_routes(app, shared_mock_db)
    return app


@pytest.fixture
def video_client(video_app):
    return video_app.test_client()


class TestGetClassified:
    """POST /api/videos/classified"""

    def test_missing_channel_id_returns_422(self, video_client):
        resp = video_client.post(
            "/api/videos/classified",
            json={"only_settings": False},
        )
        assert resp.status_code == 422
        data = resp.get_json()
        assert data["details"][0]["field"] == "channel_id"

    def test_invalid_channel_id_returns_422(self, video_client):
        resp = video_client.post(
            "/api/videos/classified",
            json={"channel_id": "invalid"},
        )
        assert resp.status_code == 422
        assert any("格式不合法" in d["message"] for d in resp.get_json()["details"])

    @patch("routes.video_routes.get_merged_settings")
    def test_only_settings_returns_settings(self, mock_settings, video_client):
        mock_settings.return_value = {"key": "value"}
        resp = video_client.post(
            "/api/videos/classified",
            json={"channel_id": "UCxxxxxxxxxxxxxxxxxxxxxx", "only_settings": True},
        )
        assert resp.status_code == 200
        assert resp.get_json()["settings"] == {"key": "value"}

    @patch("routes.video_routes.get_classified_videos")
    def test_returns_videos(self, mock_get, video_client):
        mock_get.return_value = [{"videoId": "abc", "title": "test"}]
        resp = video_client.post(
            "/api/videos/classified",
            json={"channel_id": "UCxxxxxxxxxxxxxxxxxxxxxx"},
        )
        assert resp.status_code == 200
        assert len(resp.get_json()["videos"]) == 1

    def test_invalid_time_format_returns_422(self, video_client):
        resp = video_client.post(
            "/api/videos/classified",
            json={
                "channel_id": "UCxxxxxxxxxxxxxxxxxxxxxx",
                "start": "not-a-date",
            },
        )
        assert resp.status_code == 422
        assert resp.get_json()["details"][0]["field"] == "start"


class TestCheckUpdate:
    """GET /api/videos/check-update"""

    def test_missing_channel_id_returns_422(self, video_client):
        resp = video_client.get("/api/videos/check-update")
        assert resp.status_code == 422

    def test_invalid_channel_id_returns_422(self, video_client):
        resp = video_client.get("/api/videos/check-update?channelId=bad")
        assert resp.status_code == 422

    def test_new_channel_should_update(self, video_client, shared_mock_db):
        mock_doc = MagicMock()
        mock_doc.exists = False
        shared_mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
        shared_mock_db.document.return_value.set.return_value = None

        resp = video_client.get("/api/videos/check-update?channelId=UCxxxxxxxxxxxxxxxxxxxxxx")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["shouldUpdate"] is True
        assert "updateToken" in data
