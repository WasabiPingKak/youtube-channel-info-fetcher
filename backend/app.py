from flask import Flask
from flask_cors import CORS
import logging
import os
from services.firebase_init_service import init_firestore
from utils.rate_limiter import limiter
from routes.base_routes import init_base_routes
from routes.firestore_settings_routes import init_firestore_settings_routes
from routes.category_save_apply_routes import init_category_save_apply_routes
from routes.category_editor_routes import init_category_editor_routes
from routes.video_routes import init_video_routes
from routes.video_update_route import init_video_update_route
from routes.oauth_callback_route import init_oauth_callback_route
from routes.oauth_state_route import init_oauth_state_route
from routes.init_channel_route import init_channel_route
from routes.channel_index_route import init_channel_index_route
from routes.internal_trending_route import init_internal_trending_route
from routes.public_trending_route import init_public_trending_route
from routes.me_route import init_me_route
from routes.logout_route import init_logout_route
from routes.my_settings_route import init_my_settings_route
from routes.skip_keyword_routes import init_skip_keyword_routes
from routes.quick_category_apply_route import init_quick_category_apply_route
from routes.quick_category_remove_route import init_quick_category_remove_route
from routes.sync_heatmap import init_sync_heatmap_route
from routes.api_heatmap_route import init_api_heatmap_route
from routes.admin_init_channel_route import init_admin_init_channel_route
from routes.weekly_heatmap_cache_route import init_weekly_heatmap_cache_route
from routes.websub_notify_route import init_websub_notify_route
from routes.websub_subscribe_route import init_websub_subscribe_route
from routes.live_redirect_route import init_live_redirect_route
from routes.ecpay_return_route import init_ecpay_return_route
from routes.donation_route import init_donation_route
from routes.maintenance_route import init_maintenance_route

logging.basicConfig(level=logging.INFO, force=True)

app = Flask(__name__)
limiter.init_app(app)

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
CORS(app, origins=allowed_origins, supports_credentials=True)

app.config["OAUTH_DEBUG_MODE"] = os.getenv("OAUTH_DEBUG_MODE", "false").lower() == "true"
app.config["FRONTEND_BASE_URL"] = os.getenv("FRONTEND_BASE_URL", "")


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# 初始化 Firebase，加入錯誤處理
try:
    db = init_firestore()
except Exception:
    logging.error("🔥 初始化 Firebase 失敗，服務無法啟動", exc_info=True)
    raise  # 或可視情況改為：sys.exit(1)

# 初始化各路由模組
init_base_routes(app)
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
