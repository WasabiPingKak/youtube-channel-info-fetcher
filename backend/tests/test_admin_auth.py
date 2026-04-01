"""
require_admin_key decorator 單元測試：驗證 Bearer token、env 未設定、函式包裝
"""

import os

import pytest
from flask import Flask, jsonify

from utils.admin_auth import require_admin_key

ADMIN_KEY = os.environ["ADMIN_API_KEY"]


def _make_app():
    """建立最小 Flask app，掛一條受 @require_admin_key 保護的路由"""
    app = Flask(__name__)
    app.config["TESTING"] = True

    @app.route("/admin/test")
    @require_admin_key
    def admin_endpoint():
        return jsonify({"ok": True})

    return app


@pytest.fixture
def client():
    return _make_app().test_client()


class TestRequireAdminKey:
    """測試 @require_admin_key 對各種 Authorization header 的反應"""

    def test_valid_key_passes_through(self, client):
        resp = client.get("/admin/test", headers={"Authorization": f"Bearer {ADMIN_KEY}"})
        assert resp.status_code == 200
        assert resp.get_json()["ok"] is True

    def test_missing_auth_header_returns_401(self, client):
        resp = client.get("/admin/test")
        assert resp.status_code == 401

    def test_wrong_prefix_returns_401(self, client):
        """Basic scheme 而非 Bearer → 401"""
        resp = client.get("/admin/test", headers={"Authorization": f"Basic {ADMIN_KEY}"})
        assert resp.status_code == 401

    def test_wrong_key_returns_401(self, client):
        resp = client.get("/admin/test", headers={"Authorization": "Bearer wrong-key"})
        assert resp.status_code == 401

    def test_bearer_only_empty_token_returns_401(self, client):
        """Bearer 後面是空字串 → 不等於預期 key"""
        resp = client.get("/admin/test", headers={"Authorization": "Bearer "})
        assert resp.status_code == 401

    def test_env_not_set_returns_500(self, monkeypatch):
        """未設定 ADMIN_API_KEY → 500 Server misconfigured"""
        monkeypatch.delenv("ADMIN_API_KEY", raising=False)
        client = _make_app().test_client()

        resp = client.get("/admin/test", headers={"Authorization": "Bearer anything"})
        assert resp.status_code == 500
        assert "misconfigured" in resp.get_json()["error"]

    def test_decorated_function_receives_kwargs(self):
        """裝飾後的函式能正確接收 URL 參數"""
        app = Flask(__name__)
        app.config["TESTING"] = True

        @app.route("/admin/<item_id>")
        @require_admin_key
        def admin_item(item_id):
            return jsonify({"item_id": item_id})

        client = app.test_client()
        resp = client.get("/admin/abc123", headers={"Authorization": f"Bearer {ADMIN_KEY}"})
        assert resp.status_code == 200
        assert resp.get_json()["item_id"] == "abc123"

    def test_preserves_function_name(self):
        """@wraps 應保留原函式名稱"""

        @require_admin_key
        def my_admin_func():
            pass

        assert my_admin_func.__name__ == "my_admin_func"
