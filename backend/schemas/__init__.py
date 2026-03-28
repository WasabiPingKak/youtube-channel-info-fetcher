"""Pydantic schema 模組 — 提供共用的錯誤處理註冊"""

from flask import Flask
from pydantic import ValidationError


def register_validation_error_handler(app: Flask):
    """註冊全域 Pydantic ValidationError → 422 錯誤處理"""

    @app.errorhandler(ValidationError)
    def handle_validation_error(e: ValidationError):
        details = [
            {"field": ".".join(str(x) for x in err["loc"]), "message": err["msg"]}
            for err in e.errors()
        ]
        return {"error": "請求參數驗證失敗", "details": details}, 422
