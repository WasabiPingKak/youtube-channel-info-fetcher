"""
WebSub subscribe route 測試：批次訂閱、單一訂閱、subscribe_channel_by_id
"""

import importlib
import os
from unittest.mock import MagicMock, patch

import pytest
from apiflask import APIFlask

from routes.websub_subscribe_route import subscribe_channel_by_id
from utils.rate_limiter import limiter

ADMIN_KEY = os.environ["ADMIN_API_KEY"]
ADMIN_HEADERS = {"Authorization": f"Bearer {ADMIN_KEY}"}


@pytest.fixture(scope="module")
def shared_mock_db():
    return MagicMock()


@pytest.fixture(scope="module")
def websub_app(shared_mock_db):
    import routes.websub_subscribe_route as mod

    importlib.reload(mod)

    app = APIFlask(__name__)
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    limiter.init_app(app)
    mod.init_websub_subscribe_route(app, shared_mock_db)
    return app


@pytest.fixture
def websub_client(websub_app):
    return websub_app.test_client()


class TestSubscribeChannelById:
    """subscribe_channel_by_id 單元測試"""

    def test_empty_channel_id_returns_false(self):
        assert subscribe_channel_by_id("") is False

    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": ""})
    def test_no_callback_url_returns_false(self):
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is False

    @patch("routes.websub_subscribe_route.requests.post")
    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_successful_subscribe(self, mock_post):
        mock_post.return_value = MagicMock(status_code=202)
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is True

    @patch("routes.websub_subscribe_route.requests.post")
    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_failed_subscribe_returns_false(self, mock_post):
        mock_post.return_value = MagicMock(status_code=400, text="Bad request")
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is False

    @patch("routes.websub_subscribe_route.requests.post")
    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_network_error_returns_false(self, mock_post):
        import requests

        mock_post.side_effect = requests.exceptions.ConnectionError("timeout")
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is False

    @patch("routes.websub_subscribe_route.requests.post")
    @patch.dict(
        os.environ,
        {"WEBSUB_CALLBACK_URL": "https://example.com/websub", "WEBSUB_SECRET": "my-secret"},
    )
    def test_includes_secret_when_set(self, mock_post):
        mock_post.return_value = MagicMock(status_code=202)
        subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx")
        call_data = mock_post.call_args[1]["data"]
        assert call_data["hub.secret"] == "my-secret"


class TestSubscribeAll:
    """POST /api/websub/subscribe-all"""

    def test_no_auth_returns_401(self, websub_client):
        resp = websub_client.post("/api/websub/subscribe-all")
        assert resp.status_code == 401

    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": ""})
    def test_no_callback_url_returns_400(self, websub_client):
        resp = websub_client.post(
            "/api/websub/subscribe-all",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 400

    @patch("routes.websub_subscribe_route.dispatch_tasks_batch")
    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_dispatches_tasks_for_channels(self, mock_dispatch, websub_client, shared_mock_db):
        # Mock channel_sync_index 回傳 2 個頻道
        index_doc = MagicMock()
        index_doc.to_dict.return_value = {
            "channels": [
                {"channel_id": "UC_CH_001"},
                {"channel_id": "UC_CH_002"},
            ]
        }
        shared_mock_db.collection.return_value.document.return_value.get.return_value = index_doc
        mock_dispatch.return_value = {"dispatched": 2, "failed": 0}

        resp = websub_client.post(
            "/api/websub/subscribe-all",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["dispatched"] == 2
        assert data["status"] == "success"

    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_empty_channels_returns_400(self, websub_client, shared_mock_db):
        index_doc = MagicMock()
        index_doc.to_dict.return_value = {"channels": []}
        shared_mock_db.collection.return_value.document.return_value.get.return_value = index_doc

        resp = websub_client.post(
            "/api/websub/subscribe-all",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 400


class TestSubscribeOne:
    """POST /api/websub/subscribe-one"""

    def test_no_auth_returns_401(self, websub_client):
        resp = websub_client.post("/api/websub/subscribe-one?channel_id=UCxxxxxxxxxxxxxxxxxxxxxx")
        assert resp.status_code == 401

    def test_missing_channel_id_returns_400(self, websub_client):
        resp = websub_client.post(
            "/api/websub/subscribe-one",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 400

    def test_invalid_channel_id_returns_400(self, websub_client):
        resp = websub_client.post(
            "/api/websub/subscribe-one?channel_id=invalid",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 400

    @patch("routes.websub_subscribe_route.subscribe_channel_by_id")
    def test_successful_subscribe(self, mock_sub, websub_client):
        mock_sub.return_value = True
        resp = websub_client.post(
            "/api/websub/subscribe-one?channel_id=UCxxxxxxxxxxxxxxxxxxxxxx",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"

    @patch("routes.websub_subscribe_route.subscribe_channel_by_id")
    def test_failed_subscribe_returns_500(self, mock_sub, websub_client):
        mock_sub.return_value = False
        resp = websub_client.post(
            "/api/websub/subscribe-one?channel_id=UCxxxxxxxxxxxxxxxxxxxxxx",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 500
