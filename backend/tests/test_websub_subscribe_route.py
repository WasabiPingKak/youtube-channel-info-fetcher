"""
WebSub subscribe route 測試：批次訂閱、單一訂閱、subscribe_channel_by_id

subscribe_channel_by_id 的 HTTP 呼叫改用 responses 庫。
Firestore（channel_sync_index）改用 emulator。
保留 dispatch_tasks_batch mock（Cloud Tasks 無本地 emulator）。
保留 subscribe_channel_by_id mock 在 route 層測試（本體已有獨立測試）。
"""

import importlib
import os
from unittest.mock import patch

import pytest
import responses
from conftest import create_test_app

from routes.websub_subscribe_route import HUB_URL, subscribe_channel_by_id

ADMIN_KEY = os.environ["ADMIN_API_KEY"]
ADMIN_HEADERS = {"Authorization": f"Bearer {ADMIN_KEY}"}


@pytest.fixture
def websub_app(db):
    import routes.websub_subscribe_route as mod

    importlib.reload(mod)

    app = create_test_app()
    mod.init_websub_subscribe_route(app, db)
    return app


@pytest.fixture
def websub_client(websub_app):
    return websub_app.test_client()


class TestSubscribeChannelById:
    """subscribe_channel_by_id 單元測試（使用 responses 攔截 HTTP）"""

    def test_empty_channel_id_returns_false(self):
        assert subscribe_channel_by_id("") is False

    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": ""})
    def test_no_callback_url_returns_false(self):
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is False

    @responses.activate
    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_successful_subscribe(self):
        responses.add(responses.POST, HUB_URL, status=202)
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is True

        # 驗證實際送出的 form data
        assert len(responses.calls) == 1
        body = responses.calls[0].request.body
        assert "hub.mode=subscribe" in body
        assert "UCxxxxxxxxxxxxxxxxxxxxxx" in body

    @responses.activate
    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_failed_subscribe_returns_false(self):
        responses.add(responses.POST, HUB_URL, body="Bad request", status=400)
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is False

    @responses.activate
    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_network_error_returns_false(self):
        from requests.exceptions import ConnectionError as RequestsConnectionError

        responses.add(
            responses.POST,
            HUB_URL,
            body=RequestsConnectionError("timeout"),
        )
        assert subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx") is False

    @responses.activate
    @patch.dict(
        os.environ,
        {"WEBSUB_CALLBACK_URL": "https://example.com/websub", "WEBSUB_SECRET": "my-secret"},
    )
    def test_includes_secret_when_set(self):
        responses.add(responses.POST, HUB_URL, status=202)
        subscribe_channel_by_id("UCxxxxxxxxxxxxxxxxxxxxxx")

        body = responses.calls[0].request.body
        assert "hub.secret=my-secret" in body


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
    def test_dispatches_tasks_for_channels(self, mock_dispatch, db, websub_client):
        # 在 Firestore emulator 寫入 channel_sync_index
        db.collection("channel_sync_index").document("index_list").set(
            {
                "channels": [
                    {"channel_id": "UC_CH_001"},
                    {"channel_id": "UC_CH_002"},
                ]
            }
        )
        mock_dispatch.return_value = {"dispatched": 2, "failed": 0}

        resp = websub_client.post(
            "/api/websub/subscribe-all",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["dispatched"] == 2
        assert data["status"] == "success"

        # 驗證 job log 也寫入了 Firestore
        logs = list(db.collection("scheduler_job_logs").limit(10).stream())
        assert len(logs) >= 1

    @patch.dict(os.environ, {"WEBSUB_CALLBACK_URL": "https://example.com/websub"})
    def test_empty_channels_returns_400(self, db, websub_client):
        db.collection("channel_sync_index").document("index_list").set({"channels": []})

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

    def test_missing_channel_id_returns_422(self, websub_client):
        resp = websub_client.post(
            "/api/websub/subscribe-one",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 422

    def test_invalid_channel_id_returns_422(self, websub_client):
        resp = websub_client.post(
            "/api/websub/subscribe-one?channel_id=invalid",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 422

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
