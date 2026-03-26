"""
Rate Limiting 測試：驗證 Flask-Limiter 正確攔截超量請求
"""
import pytest
from flask import Flask, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


@pytest.fixture
def rate_limited_app():
    """建立啟用 rate limiting 的獨立測試 app（使用獨立 limiter 避免與 conftest 衝突）"""
    app = Flask(__name__)
    app.config["TESTING"] = True

    test_limiter = Limiter(
        key_func=get_remote_address,
        storage_uri="memory://",
    )
    test_limiter.init_app(app)

    @app.route("/limited")
    @test_limiter.limit("3 per minute")
    def limited_route():
        return jsonify({"ok": True})

    return app


@pytest.fixture
def rate_limited_client(rate_limited_app):
    return rate_limited_app.test_client()


class TestRateLimiting:
    """驗證超過速率限制時回傳 429"""

    def test_within_limit_returns_200(self, rate_limited_client):
        resp = rate_limited_client.get("/limited")
        assert resp.status_code == 200

    def test_exceeding_limit_returns_429(self, rate_limited_client):
        # 前 3 次應成功
        for _ in range(3):
            resp = rate_limited_client.get("/limited")
            assert resp.status_code == 200

        # 第 4 次應被限速
        resp = rate_limited_client.get("/limited")
        assert resp.status_code == 429
