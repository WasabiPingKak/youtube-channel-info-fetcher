"""
app.py create_app factory 測試：初始化流程、middleware、錯誤處理

注意：app.py 在 module level 有 `app = create_app()`，
因此 mock 需用 patch("app.init_firestore") 來替換已綁定的名稱。
"""

import os
from unittest.mock import MagicMock, patch

import pytest

_ROUTES_PATCH = "utils.route_loader.register_all_routes"


def _create_test_app(config=None, **env_overrides):
    """建立測試用 app，mock Firestore 與 route registration"""
    env = {"ALLOWED_ORIGINS": "http://localhost:5173", **env_overrides}
    with patch.dict(os.environ, env, clear=False):
        with patch("app.init_firestore") as mock_init, patch(_ROUTES_PATCH):
            mock_init.return_value = MagicMock()
            from app import create_app

            return create_app(config)


class TestCreateApp:
    """create_app 基本行為"""

    def test_returns_flask_app(self):
        app = _create_test_app({"TESTING": True})
        assert app is not None
        assert app.config["TESTING"] is True

    def test_config_override(self):
        app = _create_test_app({"TESTING": True, "CUSTOM_KEY": "custom_value"})
        assert app.config["CUSTOM_KEY"] == "custom_value"

    def test_firestore_init_failure_raises(self):
        env = {"ALLOWED_ORIGINS": "http://localhost:5173"}
        with patch.dict(os.environ, env, clear=False):
            with (
                patch(
                    "app.init_firestore",
                    side_effect=Exception("Firestore unavailable"),
                ),
                patch(_ROUTES_PATCH),
            ):
                from app import create_app

                with pytest.raises(Exception, match="Firestore unavailable"):
                    create_app({"TESTING": True})


class TestMiddleware:
    """before_request / after_request middleware"""

    def test_request_id_from_header(self):
        app = _create_test_app({"TESTING": True})
        with app.test_request_context(headers={"X-Request-ID": "custom-req-id"}):
            app.preprocess_request()
            from flask import g

            assert g.request_id == "custom-req-id"

    def test_request_id_auto_generated(self):
        app = _create_test_app({"TESTING": True})
        with app.test_request_context():
            app.preprocess_request()
            from flask import g

            assert len(g.request_id) == 16

    def test_security_headers(self):
        app = _create_test_app({"TESTING": True})

        @app.route("/test-headers")
        def test_route():
            return "ok"

        client = app.test_client()
        resp = client.get("/test-headers")
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
        assert "X-Request-ID" in resp.headers


class TestCorsValidation:
    """CORS 白名單驗證"""

    def test_empty_origins_raises_in_non_testing(self):
        with pytest.raises(ValueError, match="ALLOWED_ORIGINS"):
            _create_test_app(config=None, ALLOWED_ORIGINS="")

    def test_wildcard_origins_raises_in_non_testing(self):
        with pytest.raises(ValueError, match="ALLOWED_ORIGINS"):
            _create_test_app(config=None, ALLOWED_ORIGINS="*")

    def test_testing_mode_allows_empty_origins(self):
        app = _create_test_app({"TESTING": True}, ALLOWED_ORIGINS="")
        assert app is not None
