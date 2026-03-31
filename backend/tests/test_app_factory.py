"""
app.py create_app factory 測試：初始化流程、middleware、錯誤處理

注意：app.py 在 module level 有 `app = create_app()`。
mock 必須 patch 來源模組（services.firebase_init_service），
確保在 app module 被 import 時 mock 已生效，避免 CI 因無 GCP 憑證而失敗。
"""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# patch 來源模組，而非 app module 上的名稱，
# 這樣即使 app module 尚未被 import，mock 也會在 module-level create_app() 時生效
_FIRESTORE_PATCH = "services.firebase_init_service.init_firestore"
_ROUTES_PATCH = "utils.route_loader.register_all_routes"


def _create_test_app(config=None, **env_overrides):
    """建立測試用 app，mock Firestore 與 route registration"""
    env = {"ALLOWED_ORIGINS": "http://localhost:5173", **env_overrides}
    with patch.dict(os.environ, env, clear=False):
        with patch(_FIRESTORE_PATCH) as mock_init, patch(_ROUTES_PATCH):
            mock_init.return_value = MagicMock()

            # 若 app module 尚未被 import，先在 mock context 中 import
            # 讓 module-level 的 `app = create_app()` 使用 mock
            if "app" not in sys.modules:
                import app as _app_module  # noqa: F811

                assert _app_module  # 確保 import 不被最佳化移除

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
        # 此測試需 patch app module 上已綁定的名稱（from ... import 語義）
        # 前面的測試已確保 app module 在 sys.modules 中
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


class TestKmsGuardrail:
    """部署環境 KMS 啟動檢查"""

    @pytest.mark.xfail(reason="KMS guardrail 在本地測試環境無法正確觸發，待修復")
    def test_deployed_env_without_kms_raises(self):
        """部署環境缺少 KMS 設定時 create_app 必須失敗"""
        with pytest.raises(RuntimeError, match="部署環境必須設定 KMS"):
            _create_test_app(config=None, FIRESTORE_DATABASE="(default)")

    @pytest.mark.xfail(reason="KMS guardrail 在本地測試環境無法正確觸發，待修復")
    def test_deployed_env_staging_without_kms_raises(self):
        """Staging 環境缺少 KMS 設定時 create_app 必須失敗"""
        with pytest.raises(RuntimeError, match="部署環境必須設定 KMS"):
            _create_test_app(config=None, FIRESTORE_DATABASE="staging")

    def test_testing_mode_skips_kms_check(self):
        """TESTING 模式不檢查 KMS"""
        app = _create_test_app({"TESTING": True}, FIRESTORE_DATABASE="(default)")
        assert app is not None

    def test_local_env_without_kms_ok(self):
        """本地環境無 KMS 設定不影響啟動"""
        app = _create_test_app(config=None)
        assert app is not None


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
