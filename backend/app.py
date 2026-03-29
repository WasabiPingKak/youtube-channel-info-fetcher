import logging
import os
import uuid

from apiflask import APIFlask
from flask import g, request
from flask_cors import CORS

from services.firebase_init_service import init_firestore
from utils.rate_limiter import limiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] [request_id=%(request_id)s] %(message)s",
    force=True,
)

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
    from routes.admin_init_channel_route import init_admin_init_channel_route
    from routes.api_heatmap_route import init_api_heatmap_route
    from routes.base_routes import init_base_routes
    from routes.category_editor_routes import init_category_editor_routes
    from routes.category_save_apply_routes import init_category_save_apply_routes
    from routes.channel_index_route import init_channel_index_route
    from routes.donation_route import init_donation_route
    from routes.ecpay_return_route import init_ecpay_return_route
    from routes.firestore_settings_routes import init_firestore_settings_routes
    from routes.init_channel_route import init_channel_route
    from routes.internal_trending_route import init_internal_trending_route
    from routes.live_redirect_route import init_live_redirect_route
    from routes.logout_route import init_logout_route
    from routes.maintenance_route import init_maintenance_route
    from routes.me_route import init_me_route
    from routes.my_settings_route import init_my_settings_route
    from routes.oauth_callback_route import init_oauth_callback_route
    from routes.oauth_state_route import init_oauth_state_route
    from routes.public_trending_route import init_public_trending_route
    from routes.quick_category_apply_route import init_quick_category_apply_route
    from routes.quick_category_remove_route import init_quick_category_remove_route
    from routes.skip_keyword_routes import init_skip_keyword_routes
    from routes.sync_heatmap import init_sync_heatmap_route
    from routes.video_routes import init_video_routes
    from routes.video_update_route import init_video_update_route
    from routes.websub_notify_route import init_websub_notify_route
    from routes.websub_subscribe_route import init_websub_subscribe_route
    from routes.weekly_heatmap_cache_route import init_weekly_heatmap_cache_route

    app = APIFlask(
        __name__,
        title="VTMap API",
        version="1.0.0",
        docs_ui="elements",
    )
    app.config["DESCRIPTION"] = "VTMap (Vtuber TrailMap) — YouTube 頻道分析與直播管理工具 API"

    # 套用外部 config（測試用）
    if config:
        app.config.update(config)

    # ── Rate Limiter ──
    limiter.init_app(app)

    # ── CORS ──
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
    allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
    if not app.config.get("TESTING"):
        if not allowed_origins or "*" in allowed_origins:
            raise ValueError("❌ ALLOWED_ORIGINS 必須設定具體域名，不可為空或 *")
    CORS(app, origins=allowed_origins, supports_credentials=True)

    # ── App Config ──
    app.config.setdefault(
        "OAUTH_DEBUG_MODE", os.getenv("OAUTH_DEBUG_MODE", "false").lower() == "true"
    )
    app.config.setdefault("FRONTEND_BASE_URL", os.getenv("FRONTEND_BASE_URL", ""))

    # ── 全域錯誤處理 ──
    from schemas import register_validation_error_handler

    register_validation_error_handler(app)

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

    # ── Firestore ──
    try:
        db = init_firestore()
    except Exception:
        logging.error("🔥 初始化 Firebase 失敗，服務無法啟動", exc_info=True)
        raise

    # ── 註冊路由 ──
    init_base_routes(app, db)
    init_firestore_settings_routes(app, db)
    init_category_save_apply_routes(app, db)
    init_category_editor_routes(app, db)
    init_video_routes(app, db)
    init_video_update_route(app, db)
    init_oauth_callback_route(app, db)
    init_oauth_state_route(app, db)
    init_channel_route(app, db)
    init_channel_index_route(app, db)
    init_internal_trending_route(app, db)
    init_public_trending_route(app, db)
    init_me_route(app, db)
    init_logout_route(app)
    init_my_settings_route(app, db)
    init_skip_keyword_routes(app, db)
    init_quick_category_apply_route(app, db)
    init_quick_category_remove_route(app, db)
    init_sync_heatmap_route(app, db)
    init_api_heatmap_route(app, db)
    init_admin_init_channel_route(app, db)
    init_weekly_heatmap_cache_route(app, db)
    init_websub_notify_route(app, db)
    init_websub_subscribe_route(app, db)
    init_live_redirect_route(app, db)
    init_ecpay_return_route(app, db)
    init_donation_route(app, db)
    init_maintenance_route(app, db)

    return app


# Gunicorn 入口：gunicorn app:app
app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
