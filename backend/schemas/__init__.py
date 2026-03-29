"""Pydantic schema 模組 — 提供共用的錯誤處理註冊"""

from flask import Flask
from pydantic import ValidationError


def register_validation_error_handler(app: Flask):
    """註冊全域 Pydantic ValidationError → 422 錯誤處理

    同時覆寫 apiflask 內建的 validation_error 格式，
    讓 @bp.input() 產生的 422 與手動 raise ValidationError 格式一致。
    """

    # 處理手動 raise 的 Pydantic ValidationError（未遷移的 route）
    @app.errorhandler(ValidationError)
    def handle_validation_error(e: ValidationError):
        details = [
            {"field": ".".join(str(x) for x in err["loc"]), "message": err["msg"]}
            for err in e.errors()
        ]
        return {"error": "請求參數驗證失敗", "details": details}, 422

    # 覆寫 apiflask 內建的 validation_error 格式（@bp.input() 觸發時）
    if hasattr(app, "error_processor"):

        @app.error_processor
        def custom_error_processor(error):
            if error.status_code == 422 and error.detail:
                # apiflask 的 detail 格式: {"json": {"field": ["msg", ...]}}
                details = []
                for _location, fields in (error.detail or {}).items():
                    for field, messages in (fields or {}).items():
                        for msg in messages:
                            details.append({"field": field, "message": msg})
                return {"error": "請求參數驗證失敗", "details": details}, 422
            return (
                {
                    "error": error.message,
                    "detail": error.detail,
                },
                error.status_code,
                error.headers,
            )
