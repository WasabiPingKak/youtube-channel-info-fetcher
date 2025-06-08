from flask import Flask
print("✅ [app.py] Flask app module loaded")
from flask_cors import CORS
import logging
import os
import traceback
from firebase_admin import firestore

from services.firebase_init_service import init_firestore
from routes.base_routes import init_base_routes
from routes.firestore_settings_routes import init_firestore_settings_routes
from routes.category_save_apply_routes import init_category_save_apply_routes
from routes.category_editor_routes import init_category_editor_routes
from routes.video_routes import init_video_routes
from routes.video_update_route import init_video_update_route
from routes.oauth_callback_route import init_oauth_callback_route
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

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
print("✅ [app.py] Flask app created")

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
print(f"🔓 CORS 允許來源：{allowed_origins}")
CORS(app, origins=allowed_origins, supports_credentials=True)

app.config["OAUTH_DEBUG_MODE"] = os.getenv("OAUTH_DEBUG_MODE", "false").lower() == "true"
app.config["FRONTEND_BASE_URL"] = os.getenv("FRONTEND_BASE_URL", "https://your-frontend.com")

# 初始化 Firebase，加入錯誤處理
try:
    db = init_firestore()
except Exception:
    logging.error("🔥 初始化 Firebase 失敗，服務無法啟動", exc_info=True)
    raise  # 或可視情況改為：sys.exit(1)

# 初始化各路由模組
init_base_routes(app)
init_firestore_settings_routes(app)
init_category_save_apply_routes(app, db)
init_category_editor_routes(app)
init_video_routes(app, db)
init_video_update_route(app, db)
init_oauth_callback_route(app)
init_channel_route(app)
init_channel_index_route(app, db)
init_internal_trending_route(app, db)
init_public_trending_route(app, db)
init_me_route(app)
init_logout_route(app)
init_my_settings_route(app)
init_skip_keyword_routes(app, db)
init_quick_category_apply_route(app, db)
init_quick_category_remove_route(app, db)

@app.route("/test-firestore")
def test_firestore():
    try:
        print("🚀 [test-firestore] 開始初始化 Firebase")
        db = init_firestore()
        print("✅ [test-firestore] Firebase 初始化成功")
        print("🧪 db 實體建立成功：", isinstance(db, firestore.Client))

        collection_ref = db.collection("test")
        print("📌 collection 物件：", collection_ref)

        doc_ref = collection_ref.document("ping")
        print("📌 document 物件：", doc_ref)

        doc_ref.set({"hello": "world"})
        print("✅ [test-firestore] 寫入成功🦆")
        return "✅ Firestore 測試寫入成功🦆"

    except Exception as e:
        import traceback
        logging.error("🔥 Firestore 測試失敗：%s", traceback.format_exc())
        logging.error("❗錯誤類型：%s", type(e).__name__)
        logging.error("❗錯誤訊息：%s", str(e))
        return (
            f"<h1>❌ Firestore 測試失敗</h1><pre>{traceback.format_exc()}</pre>",
            500,
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"✅ Flask app is starting on port {port}...")
    app.run(host="0.0.0.0", port=port)
