"""
Rate Limiting 測試：驗證 Flask-Limiter 正確攔截超量請求
"""

import pytest
from flask import Flask, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix


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


class TestProxyFix:
    """驗證 ProxyFix 正確解析 X-Forwarded-For，讓 rate limiter 以真實 IP 計算"""

    @pytest.fixture
    def proxy_app(self):
        app = Flask(__name__)
        app.config["TESTING"] = True
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

        test_limiter = Limiter(
            key_func=get_remote_address,
            storage_uri="memory://",
        )
        test_limiter.init_app(app)

        @app.route("/limited")
        @test_limiter.limit("2 per minute")
        def limited_route():
            return jsonify({"ok": True})

        return app

    @pytest.fixture
    def proxy_client(self, proxy_app):
        return proxy_app.test_client()

    def test_different_forwarded_ips_have_separate_limits(self, proxy_client):
        """不同 X-Forwarded-For IP 應各自計算限額"""
        # IP-A 用掉 2 次額度
        for _ in range(2):
            resp = proxy_client.get("/limited", headers={"X-Forwarded-For": "1.2.3.4"})
            assert resp.status_code == 200

        # IP-A 第 3 次被限速
        resp = proxy_client.get("/limited", headers={"X-Forwarded-For": "1.2.3.4"})
        assert resp.status_code == 429

        # IP-B 仍可正常存取
        resp = proxy_client.get("/limited", headers={"X-Forwarded-For": "5.6.7.8"})
        assert resp.status_code == 200

    def test_forwarded_for_takes_precedence(self, proxy_client):
        """X-Forwarded-For 應優先於 remote_addr 作為限速依據"""
        # 同一 test client（同 remote_addr），不同 X-Forwarded-For
        resp = proxy_client.get("/limited", headers={"X-Forwarded-For": "10.0.0.1"})
        assert resp.status_code == 200

        resp = proxy_client.get("/limited", headers={"X-Forwarded-For": "10.0.0.2"})
        assert resp.status_code == 200
