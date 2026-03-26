"""
認證流程測試：require_auth decorator、CSRF 防護、token 撤銷、sliding window 續期
"""
import pytest
from unittest.mock import MagicMock, patch
from utils.jwt_util import generate_jwt
from datetime import datetime, timezone


# ═══════════════════════════════════════════════════════
# require_auth decorator
# ═══════════════════════════════════════════════════════

class TestRequireAuth:
    """測試 @require_auth 對不同 token 狀態的反應"""

    def _make_app_with_protected_route(self, mock_db):
        """建一個只有一條受保護路由的最小 app"""
        from flask import Flask, jsonify
        from utils.auth_decorator import require_auth

        app = Flask(__name__)
        app.config["TESTING"] = True

        @app.route("/protected")
        @require_auth
        def protected(auth_channel_id=None):
            return jsonify({"channelId": auth_channel_id})

        return app

    def test_no_cookie_returns_401(self, mock_db):
        app = self._make_app_with_protected_route(mock_db)
        client = app.test_client()

        resp = client.get("/protected")
        assert resp.status_code == 401

    def test_invalid_token_returns_403(self, mock_db):
        app = self._make_app_with_protected_route(mock_db)
        client = app.test_client()

        client.set_cookie("__session", "invalid.token.here")
        resp = client.get("/protected")
        assert resp.status_code == 403

    def test_valid_token_injects_channel_id(self, mock_db):
        app = self._make_app_with_protected_route(mock_db)
        client = app.test_client()

        token = generate_jwt("UC_AUTH_TEST")
        client.set_cookie("__session", token)
        resp = client.get("/protected")

        assert resp.status_code == 200
        assert resp.get_json()["channelId"] == "UC_AUTH_TEST"


# ═══════════════════════════════════════════════════════
# OAuth callback CSRF 防護
# ═══════════════════════════════════════════════════════

class TestOAuthStateGeneration:
    """POST /api/oauth/state — 產生 state 並寫入 Firestore"""

    def test_returns_state_uuid(self, client, mock_db):
        """成功回傳 UUID 格式的 state"""
        resp = client.post("/api/oauth/state")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "state" in data
        assert len(data["state"]) == 36  # UUID 格式

    def test_writes_to_firestore(self, client, mock_db):
        """呼叫後會寫入 oauth_states collection"""
        resp = client.post("/api/oauth/state")
        state = resp.get_json()["state"]

        mock_db.collection.assert_called_with("oauth_states")
        mock_db.collection.return_value.document.assert_called_with(state)
        mock_db.collection.return_value.document.return_value.set.assert_called_once()

    def test_get_method_not_allowed(self, client):
        """GET 方法不允許"""
        resp = client.get("/api/oauth/state")
        assert resp.status_code == 405


class TestOAuthCsrf:
    """OAuth callback 的 state 參數驗證（server-side Firestore）"""

    def test_missing_state_returns_400(self, client):
        """完全沒有 state 參數 → 400"""
        resp = client.get("/oauth/callback?code=test_code")
        assert resp.status_code == 400

    def test_nonexistent_state_returns_403(self, client, mock_db):
        """URL 有 state 但 Firestore 找不到 → 403"""
        state_doc = MagicMock()
        state_doc.exists = False
        mock_db.collection.return_value \
            .document.return_value \
            .get.return_value = state_doc

        resp = client.get("/oauth/callback?code=test_code&state=abc123")
        assert resp.status_code == 403

    def test_expired_state_returns_403(self, client, mock_db):
        """Firestore 有 state 但已過期 → 403"""
        expired_time = datetime(2020, 1, 1, tzinfo=timezone.utc)
        state_doc = MagicMock()
        state_doc.exists = True
        state_doc.to_dict.return_value = {"created_at": expired_time}
        mock_db.collection.return_value \
            .document.return_value \
            .get.return_value = state_doc

        resp = client.get("/oauth/callback?code=test_code&state=abc123")
        assert resp.status_code == 403

    def test_valid_state_gets_deleted(self, client, mock_db):
        """合法 state 驗證通過後會從 Firestore 刪除（一次性使用）"""
        now = datetime.now(timezone.utc)
        state_doc = MagicMock()
        state_doc.exists = True
        state_doc.to_dict.return_value = {"created_at": now}

        state_ref = MagicMock()
        state_ref.get.return_value = state_doc

        mock_db.collection.return_value \
            .document.return_value = state_ref

        # 會因為缺少 code 之後的 token exchange 而失敗，但 state 應已被刪除
        with patch("routes.oauth_callback_route.exchange_code_for_tokens",
                   side_effect=Exception("mock")):
            resp = client.get("/oauth/callback?code=test_code&state=valid_state")

        state_ref.delete.assert_called_once()


# ═══════════════════════════════════════════════════════
# /api/me — token 撤銷檢查
# ═══════════════════════════════════════════════════════

class TestMeTokenRevocation:
    """revoked_at 晚於 token 簽發時間 → token 被拒"""

    def test_revoked_token_returns_403(self, app, mock_db):
        # 產生一個合法 token
        token = generate_jwt("UC_REVOKED")

        # Mock Firestore：meta.revoked_at 設為「未來」，確保晚於 iat
        revoked_time = datetime(2099, 1, 1, tzinfo=timezone.utc)
        meta_doc = MagicMock()
        meta_doc.to_dict.return_value = {"revoked_at": revoked_time}

        # channel_data/{id}/channel_info/meta → 回傳有 revoked_at 的 doc
        mock_db.collection.return_value \
            .document.return_value \
            .collection.return_value \
            .document.return_value \
            .get.return_value = meta_doc

        client = app.test_client()
        client.set_cookie("__session", token)
        resp = client.get("/api/me")

        assert resp.status_code == 403
        assert resp.get_json()["error"] == "Token revoked"

    def test_non_revoked_token_returns_200(self, app, mock_db):
        token = generate_jwt("UC_ACTIVE")

        # meta 沒有 revoked_at
        meta_doc = MagicMock()
        meta_doc.to_dict.return_value = {}

        # channel_index/{id} → 回傳使用者資料
        index_doc = MagicMock()
        index_doc.exists = True
        index_doc.to_dict.return_value = {
            "name": "測試頻道",
            "thumbnail": "https://example.com/thumb.jpg",
        }

        # 設定 mock chain：第一次 collection("channel_data")，第二次 collection("channel_index")
        def route_collection(name):
            mock_col = MagicMock()
            if name == "channel_data":
                mock_col.document.return_value \
                    .collection.return_value \
                    .document.return_value \
                    .get.return_value = meta_doc
            elif name == "channel_index":
                mock_col.document.return_value \
                    .get.return_value = index_doc
            return mock_col

        mock_db.collection.side_effect = route_collection

        client = app.test_client()
        client.set_cookie("__session", token)
        resp = client.get("/api/me")

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["channelId"] == "UC_ACTIVE"
        assert data["name"] == "測試頻道"


# ═══════════════════════════════════════════════════════
# /api/me — sliding window 續期
# ═══════════════════════════════════════════════════════

class TestMeSlidingWindow:
    """token 快過期時，response 應帶新的 __session cookie"""

    def test_renews_cookie_when_near_expiry(self, app, mock_db):
        token = generate_jwt("UC_RENEW")

        # Mock Firestore 回傳正常資料
        meta_doc = MagicMock()
        meta_doc.to_dict.return_value = {}

        index_doc = MagicMock()
        index_doc.exists = True
        index_doc.to_dict.return_value = {"name": "續期測試", "thumbnail": None}

        def route_collection(name):
            mock_col = MagicMock()
            if name == "channel_data":
                mock_col.document.return_value \
                    .collection.return_value \
                    .document.return_value \
                    .get.return_value = meta_doc
            elif name == "channel_index":
                mock_col.document.return_value \
                    .get.return_value = index_doc
            return mock_col

        mock_db.collection.side_effect = route_collection

        # 讓 should_renew 回傳 True（模擬快過期）
        with patch("routes.me_route.should_renew", return_value=True):
            client = app.test_client()
            client.set_cookie("__session", token)
            resp = client.get("/api/me")

        assert resp.status_code == 200
        # 檢查 response 有設定新的 __session cookie
        set_cookie_headers = [
            h for h in resp.headers.getlist("Set-Cookie")
            if "__session" in h
        ]
        assert len(set_cookie_headers) > 0, "應該要有新的 __session cookie"
