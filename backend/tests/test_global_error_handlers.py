"""全域 error handler 測試：驗證各種例外對應的 HTTP 回應格式和狀態碼"""

import pytest
from conftest import create_test_app
from google.api_core.exceptions import GoogleAPIError

from utils.exceptions import (
    AppError,
    ConfigurationError,
    ExternalServiceError,
    NotFoundError,
)


@pytest.fixture
def app():
    """建立含全域 error handler 的 test app，註冊會 raise 各種 exception 的路由"""
    app = create_test_app()

    @app.route("/raise-not-found")
    def raise_not_found():
        raise NotFoundError("找不到頻道資訊")

    @app.route("/raise-config-error")
    def raise_config_error():
        raise ConfigurationError("未設定 API Key")

    @app.route("/raise-external-error")
    def raise_external_error():
        raise ExternalServiceError("OAuth 失敗", log_message="Google 回傳 401")

    @app.route("/raise-app-error")
    def raise_app_error():
        raise AppError("自訂錯誤", status_code=422)

    @app.route("/raise-google-api-error")
    def raise_google_api_error():
        raise GoogleAPIError("Firestore timeout")

    @app.route("/raise-unexpected")
    def raise_unexpected():
        raise RuntimeError("意料之外")

    return app


@pytest.fixture
def client(app):
    return app.test_client()


class TestAppErrorHandler:
    """AppError 及其子類別的全域處理"""

    def test_not_found_returns_404(self, client):
        resp = client.get("/raise-not-found")
        assert resp.status_code == 404
        assert resp.get_json() == {"error": "找不到頻道資訊"}

    def test_config_error_returns_500(self, client):
        resp = client.get("/raise-config-error")
        assert resp.status_code == 500
        assert resp.get_json() == {"error": "未設定 API Key"}

    def test_external_service_returns_502(self, client):
        resp = client.get("/raise-external-error")
        assert resp.status_code == 502
        assert resp.get_json() == {"error": "OAuth 失敗"}

    def test_custom_status_code(self, client):
        resp = client.get("/raise-app-error")
        assert resp.status_code == 422
        assert resp.get_json() == {"error": "自訂錯誤"}


class TestGoogleAPIErrorHandler:
    """GoogleAPIError 全域處理"""

    def test_firestore_error_returns_500(self, client):
        resp = client.get("/raise-google-api-error")
        assert resp.status_code == 500
        assert resp.get_json() == {"error": "Firestore 操作失敗"}


class TestFallbackHandler:
    """未預期的 Exception 由 500 handler 接住"""

    def test_unexpected_error_returns_500(self, client):
        resp = client.get("/raise-unexpected")
        assert resp.status_code == 500
        assert resp.get_json() == {"error": "伺服器內部錯誤"}


class TestHtmlErrorResponse:
    """瀏覽器請求（Accept: text/html）應回傳純文字而非 JSON"""

    BROWSER_HEADERS = {"Accept": "text/html,application/xhtml+xml,*/*;q=0.8"}

    def test_not_found_returns_plain_text(self, client):
        resp = client.get("/raise-not-found", headers=self.BROWSER_HEADERS)
        assert resp.status_code == 404
        assert resp.data.decode() == "找不到頻道資訊"

    def test_config_error_returns_plain_text(self, client):
        resp = client.get("/raise-config-error", headers=self.BROWSER_HEADERS)
        assert resp.status_code == 500
        assert resp.data.decode() == "未設定 API Key"

    def test_google_api_error_returns_plain_text(self, client):
        resp = client.get("/raise-google-api-error", headers=self.BROWSER_HEADERS)
        assert resp.status_code == 500
        assert resp.data.decode() == "Firestore 操作失敗"

    def test_unexpected_error_returns_plain_text(self, client):
        resp = client.get("/raise-unexpected", headers=self.BROWSER_HEADERS)
        assert resp.status_code == 500
        assert resp.data.decode() == "伺服器內部錯誤"
