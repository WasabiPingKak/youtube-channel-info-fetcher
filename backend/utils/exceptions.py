"""自訂例外類別 — 依 domain 語意區分錯誤，搭配全域 error handler 回傳正確 HTTP 狀態碼"""

import logging


class AppError(Exception):
    """應用層例外基底類別，所有自訂例外都繼承此類別。

    Attributes
    ----------
    message : str
        使用者可見的錯誤訊息（會回傳至前端）。
    status_code : int
        對應的 HTTP 狀態碼。
    log_message : str | None
        內部 log 用的技術細節（不回傳至前端）。
    """

    status_code = 500

    def __init__(
        self, message: str, *, status_code: int | None = None, log_message: str | None = None
    ):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.log_message = log_message


class NotFoundError(AppError):
    """資源不存在（404）"""

    status_code = 404


class AuthorizationError(AppError):
    """權限不足或認證失敗（403）"""

    status_code = 403


class ConfigurationError(AppError):
    """系統設定缺失或錯誤（500）"""

    status_code = 500


class ExternalServiceError(AppError):
    """外部服務呼叫失敗，如 YouTube API、Google OAuth（502）"""

    status_code = 502


def register_error_handlers(app):
    """註冊全域 error handler 到 Flask/APIFlask app。

    同時供 create_app()（正式環境）和 create_test_app()（測試）使用，
    確保錯誤處理行為一致。
    """
    from google.api_core.exceptions import GoogleAPIError
    from googleapiclient.errors import HttpError

    @app.errorhandler(AppError)
    def handle_app_error(e):
        if e.status_code >= 500:
            logging.exception(e.log_message or str(e))
        else:
            logging.warning(e.log_message or str(e))
        return {"error": e.message}, e.status_code

    @app.errorhandler(GoogleAPIError)
    def handle_google_api_error(e):
        logging.exception("Firestore 操作失敗")
        return {"error": "Firestore 操作失敗"}, 500

    @app.errorhandler(HttpError)
    def handle_youtube_api_error(e):
        logging.exception("YouTube API 呼叫失敗")
        return {"error": "YouTube API 呼叫失敗"}, 502

    @app.errorhandler(500)
    def handle_internal_error(e):
        logging.exception("未處理的伺服器錯誤")
        return {"error": "伺服器內部錯誤"}, 500
