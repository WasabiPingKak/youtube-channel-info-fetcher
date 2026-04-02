"""
/api/me 路由測試：匿名訪問、JWT 驗證、撤銷檢查、admin 判斷、滑動續期

使用 Firestore emulator 取代 MagicMock。
保留 should_renew 的 patch（控制分支用，本體在 test_jwt_util.py 測試）。
"""

from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from conftest import create_test_app, seed_channel_index, seed_channel_meta

from routes.me_route import init_me_route
from utils.jwt_util import generate_jwt


@pytest.fixture
def app(db):
    app = create_test_app()
    init_me_route(app, db)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def _seed_normal_channel(db, channel_id="UC_ACTIVE_TEST_01234567"):
    """在 Firestore emulator 中 seed 一個正常頻道的完整資料"""
    seed_channel_meta(db, channel_id)
    seed_channel_index(db, channel_id, name="測試頻道", thumbnail="https://example.com/thumb.jpg")


class TestMeAnonymous:
    """未登入（無 cookie）的行為"""

    def test_no_cookie_returns_anonymous(self, client):
        resp = client.get("/api/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["channelId"] is None
        assert data["isAdmin"] is False

    def test_no_set_cookie_header(self, client):
        """匿名訪問不應設定 cookie"""
        resp = client.get("/api/me")
        set_cookies = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookies) == 0


class TestMeInvalidToken:
    """無效 token 的行為"""

    def test_invalid_token_returns_403(self, client):
        client.set_cookie("__session", "invalid.jwt.token")
        resp = client.get("/api/me")
        assert resp.status_code == 403
        assert resp.get_json()["error"] == "Invalid token"

    def test_empty_token_returns_anonymous(self, client):
        """空字串 cookie 視為匿名"""
        client.set_cookie("__session", "")
        resp = client.get("/api/me")
        assert resp.status_code == 200
        assert resp.get_json()["channelId"] is None


class TestMeTokenRevocation:
    """token 撤銷檢查"""

    def test_revoked_token_returns_403(self, db, client):
        channel_id = "UC_REVOKED_TEST"
        token = generate_jwt(channel_id)

        revoked_time = datetime(2099, 1, 1, tzinfo=UTC)
        seed_channel_meta(db, channel_id, revoked_at=revoked_time)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 403
        assert resp.get_json()["error"] == "Token revoked"

    def test_non_revoked_returns_200(self, db, client):
        channel_id = "UC_ACTIVE_TEST_01234567"
        token = generate_jwt(channel_id)
        _seed_normal_channel(db, channel_id)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["channelId"] == channel_id
        assert data["name"] == "測試頻道"


class TestMeChannelInfo:
    """Firestore 頻道資訊讀取"""

    def test_channel_not_found_returns_null_name(self, db, client):
        channel_id = "UC_NOTFOUND_TEST_012345"
        token = generate_jwt(channel_id)
        # 只 seed meta（無 revoked_at），不 seed channel_index
        seed_channel_meta(db, channel_id)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["name"] is None
        assert data["thumbnail"] is None


class TestMeAdminStatus:
    """admin 判斷"""

    def test_admin_channel_returns_is_admin_true(self, db, client):
        # UC_ADMIN_001 在 pyproject.toml 中設定為 admin
        channel_id = "UC_ADMIN_001"
        token = generate_jwt(channel_id)
        _seed_normal_channel(db, channel_id)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        assert resp.get_json()["isAdmin"] is True

    def test_non_admin_channel_returns_is_admin_false(self, db, client):
        channel_id = "UC_REGULAR_USER_1234567"
        token = generate_jwt(channel_id)
        _seed_normal_channel(db, channel_id)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        assert resp.get_json()["isAdmin"] is False


class TestMeSlidingWindow:
    """JWT 滑動視窗續期"""

    def test_renews_cookie_when_near_expiry(self, db, client):
        channel_id = "UC_RENEW_TEST_123456789"
        token = generate_jwt(channel_id)
        _seed_normal_channel(db, channel_id)

        with patch("routes.me_route.should_renew", return_value=True):
            client.set_cookie("__session", token)
            resp = client.get("/api/me")

        assert resp.status_code == 200
        set_cookies = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookies) > 0, "應設定新的 __session cookie"

    def test_no_renewal_when_not_near_expiry(self, db, client):
        channel_id = "UC_FRESH_TEST_1234567890"
        token = generate_jwt(channel_id)
        _seed_normal_channel(db, channel_id)

        with patch("routes.me_route.should_renew", return_value=False):
            client.set_cookie("__session", token)
            resp = client.get("/api/me")

        assert resp.status_code == 200
        set_cookies = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookies) == 0, "不應設定新 cookie"
