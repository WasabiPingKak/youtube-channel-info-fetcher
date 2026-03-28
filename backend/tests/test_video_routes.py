"""
Video routes 測試：/api/videos/classified 與 /api/videos/check-update
"""

import importlib
from unittest.mock import MagicMock, patch

import pytest
from flask import Flask

from utils.rate_limiter import limiter


@pytest.fixture(scope="module")
def shared_mock_db():
    return MagicMock()


@pytest.fixture(scope="module")
def video_app(shared_mock_db):
    import routes.video_routes as mod

    importlib.reload(mod)

    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    limiter.init_app(app)
    mod.init_video_routes(app, shared_mock_db)
    return app


@pytest.fixture
def video_client(video_app):
    return video_app.test_client()


class TestGetClassified:
    """POST /api/videos/classified"""

    def test_missing_channel_id_returns_400(self, video_client):
        resp = video_client.post(
            "/api/videos/classified",
            json={"only_settings": False},
        )
        assert resp.status_code == 400
        assert "channel_id" in resp.get_json()["error"]

    def test_invalid_channel_id_returns_400(self, video_client):
        resp = video_client.post(
            "/api/videos/classified",
            json={"channel_id": "invalid"},
        )
        assert resp.status_code == 400
        assert "格式不合法" in resp.get_json()["error"]

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

    def test_invalid_time_format_returns_400(self, video_client):
        resp = video_client.post(
            "/api/videos/classified",
            json={
                "channel_id": "UCxxxxxxxxxxxxxxxxxxxxxx",
                "start": "not-a-date",
            },
        )
        assert resp.status_code == 400
        assert "時間格式錯誤" in resp.get_json()["error"]


class TestCheckUpdate:
    """GET /api/videos/check-update"""

    def test_missing_channel_id_returns_400(self, video_client):
        resp = video_client.get("/api/videos/check-update")
        assert resp.status_code == 400

    def test_invalid_channel_id_returns_400(self, video_client):
        resp = video_client.get("/api/videos/check-update?channelId=bad")
        assert resp.status_code == 400

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
