"""自訂例外類別測試：status_code 預設值、message / log_message 儲存"""

from utils.exceptions import (
    AppError,
    AuthorizationError,
    ConfigurationError,
    ExternalServiceError,
    NotFoundError,
)


class TestAppError:
    """AppError 基底類別"""

    def test_default_status_code(self):
        err = AppError("錯誤")
        assert err.status_code == 500

    def test_custom_status_code(self):
        err = AppError("錯誤", status_code=418)
        assert err.status_code == 418

    def test_message_stored(self):
        err = AppError("伺服器內部錯誤")
        assert err.message == "伺服器內部錯誤"
        assert str(err) == "伺服器內部錯誤"

    def test_log_message(self):
        err = AppError("使用者可見", log_message="技術細節")
        assert err.message == "使用者可見"
        assert err.log_message == "技術細節"

    def test_log_message_default_none(self):
        err = AppError("錯誤")
        assert err.log_message is None


class TestSubclassDefaults:
    """各子類別預設 status_code"""

    def test_not_found_error(self):
        err = NotFoundError("找不到資源")
        assert err.status_code == 404
        assert isinstance(err, AppError)

    def test_authorization_error(self):
        err = AuthorizationError("權限不足")
        assert err.status_code == 403
        assert isinstance(err, AppError)

    def test_configuration_error(self):
        err = ConfigurationError("設定缺失")
        assert err.status_code == 500
        assert isinstance(err, AppError)

    def test_external_service_error(self):
        err = ExternalServiceError("外部服務失敗")
        assert err.status_code == 502
        assert isinstance(err, AppError)

    def test_subclass_can_override_status_code(self):
        err = NotFoundError("已刪除", status_code=410)
        assert err.status_code == 410
