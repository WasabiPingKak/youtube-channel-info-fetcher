"""
OAuth callback 路由測試：state 驗證、token 交換、JWT 發放、cookie 設定
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from flask import Flask

from routes.oauth_callback_route import init_oauth_callback_route
from utils.rate_limiter import limiter


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def app(mock_db):
    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    app.config["FRONTEND_BASE_URL"] = "http://localhost:5173"
    limiter.init_app(app)
    init_oauth_callback_route(app, mock_db)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


class TestOAuthCallbackDebugMode:
    """OAUTH_DEBUG_MODE 啟用時的行為"""

    def test_debug_mode_returns_debug_response(self, mock_db):
        app = Flask(__name__)
        app.config["TESTING"] = True
        app.config["RATELIMIT_ENABLED"] = False
        app.config["OAUTH_DEBUG_MODE"] = True
        limiter.init_app(app)
        init_oauth_callback_route(app, mock_db)

        client = app.test_client()
        resp = client.get("/oauth/callback?state=abc&code=xyz")
        assert resp.status_code == 200
        assert resp.get_json()["debug"] == "🧪 OAuth callback 測試模式"


class TestOAuthCallbackStateValidation:
    """OAuth state（CSRF）驗證"""

    def test_missing_state_returns_400(self, client):
        resp = client.get("/oauth/callback?code=test_code")
        assert resp.status_code == 400

    def test_nonexistent_state_returns_403(self, client, mock_db):
        state_doc = MagicMock()
        state_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = state_doc

        resp = client.get("/oauth/callback?code=test_code&state=bad_state")
        assert resp.status_code == 403

    def test_expired_state_returns_403(self, client, mock_db):
        expired_time = datetime(2020, 1, 1, tzinfo=UTC)
        state_doc = MagicMock()
        state_doc.exists = True
        state_doc.to_dict.return_value = {"created_at": expired_time}
        state_ref = MagicMock()
        state_ref.get.return_value = state_doc
        mock_db.collection.return_value.document.return_value = state_ref

        resp = client.get("/oauth/callback?code=test_code&state=expired_state")
        assert resp.status_code == 403

    def test_expired_state_gets_deleted(self, client, mock_db):
        """過期 state 應從 Firestore 刪除"""
        expired_time = datetime(2020, 1, 1, tzinfo=UTC)
        state_doc = MagicMock()
        state_doc.exists = True
        state_doc.to_dict.return_value = {"created_at": expired_time}
        state_ref = MagicMock()
        state_ref.get.return_value = state_doc
        mock_db.collection.return_value.document.return_value = state_ref

        client.get("/oauth/callback?code=test_code&state=expired_state")
        state_ref.delete.assert_called_once()


class TestOAuthCallbackCodeExchange:
    """Token 交換流程"""

    def _setup_valid_state(self, mock_db):
        """設定合法的 state mock"""
        now = datetime.now(UTC)
        state_doc = MagicMock()
        state_doc.exists = True
        state_doc.to_dict.return_value = {"created_at": now}
        state_ref = MagicMock()
        state_ref.get.return_value = state_doc
        mock_db.collection.return_value.document.return_value = state_ref

    def test_missing_code_returns_400(self, client, mock_db):
        self._setup_valid_state(mock_db)
        resp = client.get("/oauth/callback?state=valid_state")
        assert resp.status_code == 400

    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_no_access_token_returns_400(self, mock_exchange, client, mock_db):
        self._setup_valid_state(mock_db)
        mock_exchange.return_value = {"refresh_token": "rt"}

        resp = client.get("/oauth/callback?state=valid&code=test_code")
        assert resp.status_code == 400

    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_no_refresh_token_returns_400(self, mock_exchange, client, mock_db):
        self._setup_valid_state(mock_db)
        mock_exchange.return_value = {"access_token": "at"}

        resp = client.get("/oauth/callback?state=valid&code=test_code")
        assert resp.status_code == 400

    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_exchange_failure_returns_500(self, mock_exchange, client, mock_db):
        self._setup_valid_state(mock_db)
        mock_exchange.side_effect = Exception("Google API error")

        resp = client.get("/oauth/callback?state=valid&code=test_code")
        assert resp.status_code == 500

    @patch("routes.oauth_callback_route.get_channel_id")
    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_no_channel_id_returns_400(self, mock_exchange, mock_channel, client, mock_db):
        self._setup_valid_state(mock_db)
        mock_exchange.return_value = {"access_token": "at", "refresh_token": "rt"}
        mock_channel.return_value = None

        resp = client.get("/oauth/callback?state=valid&code=test_code")
        assert resp.status_code == 400


class TestOAuthCallbackSuccess:
    """完整成功流程"""

    @patch("routes.oauth_callback_route.save_channel_auth")
    @patch("routes.oauth_callback_route.get_channel_id")
    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_successful_flow_sets_cookie_and_redirects(
        self, mock_exchange, mock_channel, mock_save, client, mock_db
    ):
        # 設定合法 state
        now = datetime.now(UTC)
        state_doc = MagicMock()
        state_doc.exists = True
        state_doc.to_dict.return_value = {"created_at": now}
        state_ref = MagicMock()
        state_ref.get.return_value = state_doc
        mock_db.collection.return_value.document.return_value = state_ref

        mock_exchange.return_value = {"access_token": "at_123", "refresh_token": "rt_123"}
        mock_channel.return_value = "UCxxxxxxxxxxxxxxxxxxxxxx"

        resp = client.get("/oauth/callback?state=valid&code=auth_code")

        # 應該 redirect
        assert resp.status_code == 302
        assert "UCxxxxxxxxxxxxxxxxxxxxxx" in resp.headers["Location"]

        # 應該設定 __session cookie
        set_cookie = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookie) == 1
        assert "HttpOnly" in set_cookie[0]

        # 應該儲存 channel auth
        mock_save.assert_called_once_with(mock_db, "UCxxxxxxxxxxxxxxxxxxxxxx", "rt_123")
