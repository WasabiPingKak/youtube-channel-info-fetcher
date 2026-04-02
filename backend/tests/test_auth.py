"""
認證流程測試：require_auth decorator、CSRF 防護、token 撤銷、sliding window 續期

使用 Firestore emulator 取代 MagicMock。
"""

from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from conftest import (
    create_test_app_with_routes,
    seed_channel_index,
    seed_channel_meta,
    seed_oauth_state,
)

from utils.jwt_util import generate_jwt

# ═══════════════════════════════════════════════════════
# require_auth decorator
# ═══════════════════════════════════════════════════════


class TestRequireAuth:
    """測試 @require_auth(db) 對不同 token 狀態的反應"""

    @pytest.fixture
    def protected_app(self, db):
        """建一個只有一條受保護路由的最小 app"""
        from flask import Flask, jsonify

        from utils.auth_decorator import require_auth

        app = Flask(__name__)
        app.config["TESTING"] = True

        @app.route("/protected")
        @require_auth(db)
        def protected(auth_channel_id=None):
            return jsonify({"channelId": auth_channel_id})

        return app

    @pytest.fixture
    def protected_client(self, protected_app):
        return protected_app.test_client()

    def test_no_cookie_returns_401(self, protected_client):
        resp = protected_client.get("/protected")
        assert resp.status_code == 401

    def test_invalid_token_returns_403(self, protected_client):
        protected_client.set_cookie("__session", "invalid.token.here")
        resp = protected_client.get("/protected")
        assert resp.status_code == 403

    def test_valid_token_injects_channel_id(self, db, protected_client):
        channel_id = "UC_AUTH_TEST"
        seed_channel_meta(db, channel_id)

        token = generate_jwt(channel_id)
        protected_client.set_cookie("__session", token)
        resp = protected_client.get("/protected")

        assert resp.status_code == 200
        assert resp.get_json()["channelId"] == channel_id

    def test_revoked_token_returns_403(self, db, protected_client):
        """require_auth 應檢查 revoked_at，被撤銷的 token 回傳 403"""
        channel_id = "UC_REVOKED_TEST"
        revoked_time = datetime(2099, 1, 1, tzinfo=UTC)
        seed_channel_meta(db, channel_id, revoked_at=revoked_time)

        token = generate_jwt(channel_id)
        protected_client.set_cookie("__session", token)
        resp = protected_client.get("/protected")

        assert resp.status_code == 403
        assert resp.get_json()["error"] == "Token revoked"

    def test_cache_avoids_repeated_firestore_calls(self, db, protected_client):
        """第二次請求應命中快取，不再查 Firestore"""
        channel_id = "UC_CACHE_TEST"
        seed_channel_meta(db, channel_id)
        token = generate_jwt(channel_id)
        protected_client.set_cookie("__session", token)

        # 第一次請求 → 查 Firestore（成功）
        resp1 = protected_client.get("/protected")
        assert resp1.status_code == 200

        # 刪除 Firestore 中的 meta doc — 若再查會找不到
        db.collection("channel_data").document(channel_id).collection("channel_info").document(
            "meta"
        ).delete()

        # 第二次請求 → 應命中快取，不查 Firestore → 仍然成功
        resp2 = protected_client.get("/protected")
        assert resp2.status_code == 200

    def test_clear_revoke_cache_forces_refetch(self, db, protected_client):
        """clear_revoke_cache 後下一次請求應重新查 Firestore"""
        from utils.auth_decorator import clear_revoke_cache

        channel_id = "UC_CLEAR_TEST"
        seed_channel_meta(db, channel_id)
        token = generate_jwt(channel_id)
        protected_client.set_cookie("__session", token)

        # 第一次請求 → 查 Firestore 並寫入快取
        resp1 = protected_client.get("/protected")
        assert resp1.status_code == 200

        # 清除快取，同時更新 Firestore 為 revoked
        clear_revoke_cache(channel_id)
        revoked_time = datetime(2099, 1, 1, tzinfo=UTC)
        seed_channel_meta(db, channel_id, revoked_at=revoked_time)

        # 第二次請求 → 重新查 Firestore → 發現已撤銷
        resp2 = protected_client.get("/protected")
        assert resp2.status_code == 403


# ═══════════════════════════════════════════════════════
# OAuth callback CSRF 防護
# ═══════════════════════════════════════════════════════


class TestOAuthStateGeneration:
    """POST /api/oauth/state — 產生 state 並寫入 Firestore"""

    @pytest.fixture
    def auth_app(self, db):
        return create_test_app_with_routes(db)

    @pytest.fixture
    def auth_client(self, auth_app):
        return auth_app.test_client()

    def test_returns_state_uuid(self, auth_client):
        """成功回傳 UUID 格式的 state"""
        resp = auth_client.post("/api/oauth/state")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "state" in data
        assert len(data["state"]) == 36  # UUID 格式

    def test_writes_to_firestore(self, db, auth_client):
        """呼叫後 state 會出現在 Firestore oauth_states collection"""
        resp = auth_client.post("/api/oauth/state")
        state = resp.get_json()["state"]

        # 直接從 Firestore 讀回驗證
        doc = db.collection("oauth_states").document(state).get()
        assert doc.exists
        data = doc.to_dict()
        assert "created_at" in data

    def test_get_method_not_allowed(self, auth_client):
        """GET 方法不允許"""
        resp = auth_client.get("/api/oauth/state")
        assert resp.status_code == 405


class TestOAuthCsrf:
    """OAuth callback 的 state 參數驗證（server-side Firestore）"""

    @pytest.fixture
    def auth_app(self, db):
        return create_test_app_with_routes(db)

    @pytest.fixture
    def auth_client(self, auth_app):
        return auth_app.test_client()

    def test_missing_state_returns_400(self, auth_client):
        """完全沒有 state 參數 → 400"""
        resp = auth_client.get("/oauth/callback?code=test_code")
        assert resp.status_code == 400

    def test_nonexistent_state_returns_403(self, auth_client):
        """URL 有 state 但 Firestore 找不到 → 403"""
        resp = auth_client.get("/oauth/callback?code=test_code&state=nonexistent_abc123")
        assert resp.status_code == 403

    def test_expired_state_returns_403(self, db, auth_client):
        """Firestore 有 state 但已過期 → 403"""
        expired_time = datetime(2020, 1, 1, tzinfo=UTC)
        seed_oauth_state(db, "expired_state", created_at=expired_time)

        resp = auth_client.get("/oauth/callback?code=test_code&state=expired_state")
        assert resp.status_code == 403

    def test_valid_state_gets_deleted(self, db, auth_client):
        """合法 state 驗證通過後會從 Firestore 刪除（一次性使用）"""
        seed_oauth_state(db, "valid_state")

        # 會因為 token exchange 失敗，但 state 應已被刪除
        with patch(
            "routes.oauth_callback_route.exchange_code_for_tokens",
            side_effect=Exception("mock"),
        ):
            auth_client.get("/oauth/callback?code=test_code&state=valid_state")

        doc = db.collection("oauth_states").document("valid_state").get()
        assert not doc.exists


# ═══════════════════════════════════════════════════════
# /api/me — token 撤銷檢查
# ═══════════════════════════════════════════════════════


class TestMeTokenRevocation:
    """revoked_at 晚於 token 簽發時間 → token 被拒"""

    @pytest.fixture
    def auth_app(self, db):
        return create_test_app_with_routes(db)

    @pytest.fixture
    def auth_client(self, auth_app):
        return auth_app.test_client()

    def test_revoked_token_returns_403(self, db, auth_client):
        channel_id = "UC_REVOKED"
        token = generate_jwt(channel_id)

        revoked_time = datetime(2099, 1, 1, tzinfo=UTC)
        seed_channel_meta(db, channel_id, revoked_at=revoked_time)

        auth_client.set_cookie("__session", token)
        resp = auth_client.get("/api/me")

        assert resp.status_code == 403
        assert resp.get_json()["error"] == "Token revoked"

    def test_non_revoked_token_returns_200(self, db, auth_client):
        channel_id = "UC_ACTIVE"
        token = generate_jwt(channel_id)

        seed_channel_meta(db, channel_id)
        seed_channel_index(
            db, channel_id, name="測試頻道", thumbnail="https://example.com/thumb.jpg"
        )

        auth_client.set_cookie("__session", token)
        resp = auth_client.get("/api/me")

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["channelId"] == channel_id
        assert data["name"] == "測試頻道"


# ═══════════════════════════════════════════════════════
# /api/me — sliding window 續期
# ═══════════════════════════════════════════════════════


class TestMeSlidingWindow:
    """token 快過期時，response 應帶新的 __session cookie"""

    @pytest.fixture
    def auth_app(self, db):
        return create_test_app_with_routes(db)

    @pytest.fixture
    def auth_client(self, auth_app):
        return auth_app.test_client()

    def test_renews_cookie_when_near_expiry(self, db, auth_client):
        channel_id = "UC_RENEW"
        token = generate_jwt(channel_id)

        seed_channel_meta(db, channel_id)
        seed_channel_index(db, channel_id, name="續期測試")

        with patch("routes.me_route.should_renew", return_value=True):
            auth_client.set_cookie("__session", token)
            resp = auth_client.get("/api/me")

        assert resp.status_code == 200
        set_cookie_headers = [h for h in resp.headers.getlist("Set-Cookie") if "__session" in h]
        assert len(set_cookie_headers) > 0, "應該要有新的 __session cookie"
