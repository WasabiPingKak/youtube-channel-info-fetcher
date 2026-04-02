"""
OAuth callback 路由測試：state 驗證、token 交換、JWT 發放、cookie 設定

Firestore（oauth_states）改用 emulator，
保留 exchange_code_for_tokens / get_channel_id / save_channel_auth 的 patch（route orchestration）。
"""

from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from conftest import create_test_app, seed_oauth_state

from routes.oauth_callback_route import init_oauth_callback_route


@pytest.fixture
def app(db):
    app = create_test_app(FRONTEND_BASE_URL="http://localhost:5173")
    init_oauth_callback_route(app, db)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


class TestOAuthCallbackDebugMode:
    """OAUTH_DEBUG_MODE 啟用時的行為"""

    def test_debug_mode_returns_debug_response(self, db):
        app = create_test_app(OAUTH_DEBUG_MODE=True)
        init_oauth_callback_route(app, db)

        client = app.test_client()
        resp = client.get("/oauth/callback?state=abc&code=xyz")
        assert resp.status_code == 200
        assert resp.get_json()["debug"] == "🧪 OAuth callback 測試模式"


class TestOAuthCallbackStateValidation:
    """OAuth state（CSRF）驗證"""

    def test_missing_state_returns_400(self, client):
        resp = client.get("/oauth/callback?code=test_code")
        assert resp.status_code == 400

    def test_nonexistent_state_returns_403(self, client):
        resp = client.get("/oauth/callback?code=test_code&state=bad_state")
        assert resp.status_code == 403

    def test_expired_state_returns_403(self, db, client):
        expired_time = datetime(2020, 1, 1, tzinfo=UTC)
        seed_oauth_state(db, "expired_state", created_at=expired_time)

        resp = client.get("/oauth/callback?code=test_code&state=expired_state")
        assert resp.status_code == 403

    def test_expired_state_gets_deleted(self, db, client):
        """過期 state 應從 Firestore 刪除"""
        expired_time = datetime(2020, 1, 1, tzinfo=UTC)
        seed_oauth_state(db, "expired_state_del", created_at=expired_time)

        client.get("/oauth/callback?code=test_code&state=expired_state_del")

        doc = db.collection("oauth_states").document("expired_state_del").get()
        assert not doc.exists


class TestOAuthCallbackCodeExchange:
    """Token 交換流程"""

    def test_missing_code_returns_400(self, db, client):
        seed_oauth_state(db, "valid_state")
        resp = client.get("/oauth/callback?state=valid_state")
        assert resp.status_code == 400

    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_no_access_token_returns_400(self, mock_exchange, db, client):
        seed_oauth_state(db, "valid_state")
        mock_exchange.return_value = {"refresh_token": "rt"}

        resp = client.get("/oauth/callback?state=valid_state&code=test_code")
        assert resp.status_code == 400

    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_no_refresh_token_returns_400(self, mock_exchange, db, client):
        seed_oauth_state(db, "valid_state")
        mock_exchange.return_value = {"access_token": "at"}

        resp = client.get("/oauth/callback?state=valid_state&code=test_code")
        assert resp.status_code == 400

    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_exchange_failure_returns_500(self, mock_exchange, db, client):
        seed_oauth_state(db, "valid_state")
        mock_exchange.side_effect = Exception("Google API error")

        resp = client.get("/oauth/callback?state=valid_state&code=test_code")
        assert resp.status_code == 500

    @patch("routes.oauth_callback_route.get_channel_id")
    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_no_channel_id_returns_400(self, mock_exchange, mock_channel, db, client):
        seed_oauth_state(db, "valid_state")
        mock_exchange.return_value = {"access_token": "at", "refresh_token": "rt"}
        mock_channel.return_value = None

        resp = client.get("/oauth/callback?state=valid_state&code=test_code")
        assert resp.status_code == 400


class TestOAuthCallbackSuccess:
    """完整成功流程"""

    @patch("routes.oauth_callback_route.save_channel_auth")
    @patch("routes.oauth_callback_route.get_channel_id")
    @patch("routes.oauth_callback_route.exchange_code_for_tokens")
    def test_successful_flow_sets_cookie_and_redirects(
        self, mock_exchange, mock_channel, mock_save, db, client
    ):
        seed_oauth_state(db, "valid_state")

        mock_exchange.return_value = {"access_token": "at_123", "refresh_token": "rt_123"}
        mock_channel.return_value = "UCxxxxxxxxxxxxxxxxxxxxxx"

        resp = client.get("/oauth/callback?state=valid_state&code=auth_code")

        # 應該 redirect
        assert resp.status_code == 302
        assert "UCxxxxxxxxxxxxxxxxxxxxxx" in resp.headers["Location"]

        # 應該設定 __session cookie
        set_cookie = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookie) == 1
        assert "HttpOnly" in set_cookie[0]

        # 應該儲存 channel auth
        mock_save.assert_called_once_with(db, "UCxxxxxxxxxxxxxxxxxxxxxx", "rt_123")

        # state 應該已被刪除（一次性使用）
        doc = db.collection("oauth_states").document("valid_state").get()
        assert not doc.exists
