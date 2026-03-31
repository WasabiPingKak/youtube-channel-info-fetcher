"""
/api/me 路由測試：匿名訪問、JWT 驗證、撤銷檢查、admin 判斷、滑動續期
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from conftest import create_test_app

from routes.me_route import init_me_route
from utils.jwt_util import generate_jwt


@pytest.fixture
def app(mock_db):
    app = create_test_app()
    init_me_route(app, mock_db)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def _setup_normal_db(mock_db, *, name="測試頻道", thumbnail="https://example.com/thumb.jpg"):
    """設定正常的 Firestore mock（meta 無 revoked_at、channel_index 有資料）"""
    meta_doc = MagicMock()
    meta_doc.to_dict.return_value = {}

    index_doc = MagicMock()
    index_doc.exists = True
    index_doc.to_dict.return_value = {"name": name, "thumbnail": thumbnail}

    def route_collection(col_name):
        mock_col = MagicMock()
        if col_name == "channel_data":
            mock_col.document.return_value.collection.return_value.document.return_value.get.return_value = meta_doc
        elif col_name == "channel_index":
            mock_col.document.return_value.get.return_value = index_doc
        return mock_col

    mock_db.collection.side_effect = route_collection


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

    def test_revoked_token_returns_403(self, client, mock_db):
        token = generate_jwt("UC_REVOKED_TEST")

        revoked_time = datetime(2099, 1, 1, tzinfo=UTC)
        meta_doc = MagicMock()
        meta_doc.to_dict.return_value = {"revoked_at": revoked_time}

        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.get.return_value = meta_doc

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 403
        assert resp.get_json()["error"] == "Token revoked"

    def test_non_revoked_returns_200(self, client, mock_db):
        token = generate_jwt("UC_ACTIVE_TEST_01234567")
        _setup_normal_db(mock_db)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["channelId"] == "UC_ACTIVE_TEST_01234567"
        assert data["name"] == "測試頻道"


class TestMeChannelInfo:
    """Firestore 頻道資訊讀取"""

    def test_channel_not_found_returns_null_name(self, client, mock_db):
        token = generate_jwt("UC_NOTFOUND_TEST_012345")

        meta_doc = MagicMock()
        meta_doc.to_dict.return_value = {}

        index_doc = MagicMock()
        index_doc.exists = False

        def route_collection(col_name):
            mock_col = MagicMock()
            if col_name == "channel_data":
                mock_col.document.return_value.collection.return_value.document.return_value.get.return_value = meta_doc
            elif col_name == "channel_index":
                mock_col.document.return_value.get.return_value = index_doc
            return mock_col

        mock_db.collection.side_effect = route_collection

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["name"] is None
        assert data["thumbnail"] is None


class TestMeAdminStatus:
    """admin 判斷"""

    def test_admin_channel_returns_is_admin_true(self, client, mock_db):
        # UC_ADMIN_001 在 conftest.py 中設定為 admin
        token = generate_jwt("UC_ADMIN_001")
        _setup_normal_db(mock_db)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        assert resp.get_json()["isAdmin"] is True

    def test_non_admin_channel_returns_is_admin_false(self, client, mock_db):
        token = generate_jwt("UC_REGULAR_USER_1234567")
        _setup_normal_db(mock_db)

        client.set_cookie("__session", token)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        assert resp.get_json()["isAdmin"] is False


class TestMeSlidingWindow:
    """JWT 滑動視窗續期"""

    def test_renews_cookie_when_near_expiry(self, client, mock_db):
        token = generate_jwt("UC_RENEW_TEST_123456789")
        _setup_normal_db(mock_db)

        with patch("routes.me_route.should_renew", return_value=True):
            client.set_cookie("__session", token)
            resp = client.get("/api/me")

        assert resp.status_code == 200
        set_cookies = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookies) > 0, "應設定新的 __session cookie"

    def test_no_renewal_when_not_near_expiry(self, client, mock_db):
        token = generate_jwt("UC_FRESH_TEST_1234567890")
        _setup_normal_db(mock_db)

        with patch("routes.me_route.should_renew", return_value=False):
            client.set_cookie("__session", token)
            resp = client.get("/api/me")

        assert resp.status_code == 200
        set_cookies = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookies) == 0, "不應設定新 cookie"
