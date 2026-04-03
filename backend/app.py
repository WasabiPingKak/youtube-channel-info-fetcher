import logging
import os
import uuid

from apiflask import APIFlask
from flask import g, request
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from services.firebase_init_service import init_firestore
from utils.logging_config import setup_logging
from utils.rate_limiter import limiter

setup_logging()

# 讓沒有 request context 的 log 也能正常輸出
old_factory = logging.getLogRecordFactory()


def record_factory(*args, **kwargs):
    record = old_factory(*args, **kwargs)
    try:
        record.request_id = g.request_id
    except (AttributeError, RuntimeError):
        record.request_id = "-"
    return record


logging.setLogRecordFactory(record_factory)


def create_app(config=None):
    """Flask Application Factory — 建立並回傳 Flask app 實例。

    Parameters
    ----------
    config : dict | None
        額外的 Flask config，測試時可傳入 {"TESTING": True} 等設定。
    """
    # ── 本地開發時載入 .env.local（Cloud Run 由環境變數注入，不需要）──
    if os.getenv("ENV") != "production":
        from pathlib import Path

        from dotenv import load_dotenv

        env_path = Path(__file__).resolve().parent / ".env.local"
        load_dotenv(dotenv_path=env_path)

    from utils.route_loader import register_all_routes

    # Swagger UI 僅在 staging 環境啟用
    is_staging = os.getenv("FIRESTORE_DATABASE") == "staging"

    app = APIFlask(
        __name__,
        title="VTMap API",
        version="1.0.0",
        docs_ui="elements",
        enable_openapi=is_staging,
    )
    app.config["DESCRIPTION"] = "VTMap (Vtuber TrailMap) — YouTube 頻道分析與直播管理工具 API"

    # 套用外部 config（測試用）
    if config:
        app.config.update(config)

    # ── Proxy Fix（Cloud Run 位於 Load Balancer 後方）──
    # 信任 1 層 proxy 的 X-Forwarded-For / X-Forwarded-Proto
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)  # type: ignore[method-assign]

    # ── Rate Limiter ──
    app.config.setdefault("RATELIMIT_STORAGE_URI", os.getenv("RATE_LIMIT_STORAGE_URL", "memory://"))
    limiter.init_app(app)

    # ── CORS ──
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
    allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
    if not app.config.get("TESTING"):
        if not allowed_origins or "*" in allowed_origins:
            raise ValueError("❌ ALLOWED_ORIGINS 必須設定具體域名，不可為空或 *")
    CORS(app, origins=allowed_origins, supports_credentials=True)

    # ── OpenTelemetry（Cloud Run 環境自動啟用）──
    from utils.otel_setup import init_otel

    init_otel(app)

    # ── App Config ──
    app.config.setdefault(
        "OAUTH_DEBUG_MODE", os.getenv("OAUTH_DEBUG_MODE", "false").lower() == "true"
    )
    app.config.setdefault("FRONTEND_BASE_URL", os.getenv("FRONTEND_BASE_URL", ""))

    # ── 全域錯誤處理 ──
    from schemas import register_validation_error_handler
    from utils.exceptions import register_error_handlers

    register_validation_error_handler(app)
    register_error_handlers(app)

    # ── Middleware ──
    @app.before_request
    def assign_request_id():
        g.request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:16]

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Request-ID"] = g.get("request_id", "-")
        return response

    # ── KMS Guardrail（部署環境必須設定 KMS）──
    if not app.config.get("TESTING"):
        from utils.kms_crypto import _is_deployed_env, is_kms_configured

        if _is_deployed_env() and not is_kms_configured():
            raise RuntimeError(
                "❌ 部署環境必須設定 KMS（KMS_KEY_RING、KMS_KEY_ID、GOOGLE_CLOUD_PROJECT）"
            )

    # ── Firestore ──
    try:
        db = init_firestore()
    except Exception:
        logging.error("🔥 初始化 Firebase 失敗，服務無法啟動", exc_info=True)
        raise

    # ── 註冊路由 ──
    register_all_routes(app, db)

    return app


# Gunicorn 入口：gunicorn app:app
app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
